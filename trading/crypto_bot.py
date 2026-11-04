"""Autonomous crypto spot bot (trend-pullback strategy, long only).

Run once per invocation; the GitHub Actions workflow calls it hourly.

  python -m trading.crypto_bot

Paper mode (default) simulates fills against live public prices and keeps the
portfolio in state/crypto_paper.json. Live mode sends real orders through
ccxt and needs config mode "live", ALLOW_LIVE=yes, and EXCHANGE_API_KEY /
EXCHANGE_API_SECRET.

Each run:
  1. Processes candles that closed since the last run (signals, trailing stops).
  2. Exits any position whose stop or target the current price has crossed.
  3. Enters new positions flagged on the latest closed candle, within limits.
"""

import datetime as dt
import json
import os
import sys
from pathlib import Path

from trading import strategy

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config" / "crypto.json"
STATE = ROOT / "state" / "crypto_paper.json"
LIVE_STATE = ROOT / "state" / "crypto_live.json"
LOG = ROOT / "logs" / "crypto.jsonl"


def now():
    return dt.datetime.now(dt.timezone.utc)


def log(event):
    event["time"] = now().isoformat(timespec="seconds")
    print(json.dumps(event))
    LOG.parent.mkdir(exist_ok=True)
    with open(LOG, "a") as f:
        f.write(json.dumps(event) + "\n")


def load_json(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def save_json(path, data):
    path.parent.mkdir(exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


class PaperBroker:
    """Simulated spot account. Cash in quote currency, positions in state."""

    def __init__(self, state, fee_pct, slippage_pct):
        self.state, self.fee, self.slip = state, fee_pct / 100, slippage_pct / 100

    def cash(self):
        return self.state["cash"]

    def buy(self, symbol, units, price):
        fill = price * (1 + self.slip)
        cost = units * fill * (1 + self.fee)
        if cost > self.state["cash"]:
            units = self.state["cash"] / (fill * (1 + self.fee))
            cost = self.state["cash"]
        self.state["cash"] -= cost
        return units, fill

    def sell(self, symbol, units, price):
        fill = price * (1 - self.slip)
        self.state["cash"] += units * fill * (1 - self.fee)
        return fill


class LiveBroker:
    def __init__(self, exchange, quote):
        self.ex, self.quote = exchange, quote

    def cash(self):
        return float(self.ex.fetch_balance()["free"].get(self.quote, 0.0))

    def buy(self, symbol, units, price):
        units = float(self.ex.amount_to_precision(symbol, units))
        order = self.ex.create_market_buy_order(symbol, units)
        return float(order.get("filled") or units), float(order.get("average") or price)

    def sell(self, symbol, units, price):
        units = float(self.ex.amount_to_precision(symbol, units))
        order = self.ex.create_market_sell_order(symbol, units)
        return float(order.get("average") or price)


def equity(state, broker, prices):
    held = sum(pos["units"] * prices.get(sym, pos["entry"]) for sym, pos in state["positions"].items())
    return broker.cash() + held


def run(cfg, market, broker, state, dry_run=False):
    """market: object with ohlcv(symbol, timeframe) and price(symbol)."""
    p = {**strategy.DEFAULTS, **cfg.get("strategy", {})}
    risk = cfg["risk"]
    state.setdefault("positions", {})
    state.setdefault("last_candle", {})

    if not cfg.get("trading_enabled", False):
        log({"event": "skip", "reason": "trading_enabled is false (kill switch)"})
        return state

    prices, signals = {}, []
    for symbol in cfg["symbols"]:
        candles = market.ohlcv(symbol, cfg["timeframe"])[:-1]  # drop the forming candle
        if len(candles) < strategy.warmup(p) + 1:
            log({"event": "skip", "symbol": symbol, "reason": "not enough history"})
            continue
        prices[symbol] = market.price(symbol)
        ind = strategy.indicators(candles, p)
        last_seen = state["last_candle"].get(symbol, 0)
        new_idx = [i for i, c in enumerate(candles) if c[0] > last_seen]
        if last_seen == 0:
            new_idx = new_idx[-1:]  # first run: only judge the latest candle
        pos = state["positions"].get(symbol)

        for i in new_idx:
            if pos is None:
                continue
            action, value, reason = strategy.manage(pos, candles[i], ind, i, p)
            if action == "exit":
                exit_position(state, broker, symbol, prices[symbol], reason, dry_run)
                pos = None
            else:
                pos["stop"] = value

        if pos is not None and (prices[symbol] <= pos["stop"] or prices[symbol] >= pos["target"]):
            reason = "stop" if prices[symbol] <= pos["stop"] else "target"
            exit_position(state, broker, symbol, prices[symbol], reason, dry_run)
            pos = None

        last = len(candles) - 1
        if pos is None and last in new_idx and strategy.entry_signal(ind, last, p):
            signals.append((symbol, ind["atr"][last]))
        state["last_candle"][symbol] = candles[-1][0]

    eq = equity(state, broker, prices)
    today = now().date().isoformat()
    if state.get("day") != today:
        state["day"], state["day_start_equity"] = today, eq
    loss_pct = max(0.0, (state["day_start_equity"] - eq) / state["day_start_equity"] * 100)
    halted = loss_pct >= risk["max_daily_loss_pct"]
    if halted and signals:
        log({"event": "halt", "reason": f"daily loss {loss_pct:.2f}% hit limit; no new entries"})
        signals = []

    for symbol, atr_value in signals:
        if len(state["positions"]) >= risk["max_open_positions"]:
            log({"event": "skip", "symbol": symbol, "reason": "max open positions"})
            continue
        exposure = sum(pos["units"] * prices[s] for s, pos in state["positions"].items())
        room = eq * risk["max_total_exposure_pct"] / 100 - exposure
        price = prices[symbol]
        levels = strategy.open_levels(price, atr_value, p)
        units = min(strategy.position_size(eq, price, levels["stop"], p), max(room, 0) / price)
        if units * price < 10:
            log({"event": "skip", "symbol": symbol, "reason": "risk limits leave no room"})
            continue
        log({"event": "buy", "symbol": symbol, "units": round(units, 8), "price": price,
             "stop": round(levels["stop"], 2), "target": round(levels["target"], 2), "dry_run": dry_run})
        if dry_run:
            continue
        filled, fill = broker.buy(symbol, units, price)
        state["positions"][symbol] = {"units": filled, "entry": fill,
                                      "opened": now().isoformat(timespec="seconds"), **levels}

    log({"event": "summary", "mode": cfg["mode"], "equity": round(equity(state, broker, prices), 2),
         "cash": round(broker.cash(), 2), "open": sorted(state["positions"]),
         "daily_loss_pct": round(loss_pct, 2)})
    return state


def exit_position(state, broker, symbol, price, reason, dry_run):
    pos = state["positions"][symbol]
    log({"event": "sell", "symbol": symbol, "reason": reason, "price": price,
         "entry": pos["entry"], "dry_run": dry_run})
    if dry_run:
        return
    fill = broker.sell(symbol, pos["units"], price)
    pnl = (fill - pos["entry"]) * pos["units"]
    log({"event": "closed", "symbol": symbol, "pnl": round(pnl, 2), "reason": reason})
    state.setdefault("closed", []).append({"symbol": symbol, "entry": pos["entry"], "exit": fill,
                                           "units": pos["units"], "pnl": pnl, "reason": reason,
                                           "opened": pos["opened"],
                                           "closed": now().isoformat(timespec="seconds")})
    del state["positions"][symbol]


class CcxtMarket:
    def __init__(self, exchange):
        self.ex = exchange

    def ohlcv(self, symbol, timeframe):
        return self.ex.fetch_ohlcv(symbol, timeframe, limit=400)

    def price(self, symbol):
        return float(self.ex.fetch_ticker(symbol)["last"])


def main():
    import ccxt

    cfg = load_json(CONFIG, None)
    dry_run = os.getenv("DRY_RUN") == "1"
    ex_class = getattr(ccxt, cfg["exchange"])

    if cfg["mode"] == "live":
        if os.getenv("ALLOW_LIVE") != "yes":
            sys.exit("config mode is live but ALLOW_LIVE=yes is not set; refusing")
        key, secret = os.getenv("EXCHANGE_API_KEY"), os.getenv("EXCHANGE_API_SECRET")
        if not key or not secret:
            sys.exit("EXCHANGE_API_KEY and EXCHANGE_API_SECRET must be set for live mode")
        ex = ex_class({"apiKey": key, "secret": secret, "enableRateLimit": True})
        state_path = LIVE_STATE
        state = load_json(state_path, {"positions": {}})
        broker = LiveBroker(ex, cfg["quote"])
    else:
        ex = ex_class({"enableRateLimit": True})
        state_path = STATE
        state = load_json(state_path, {"cash": cfg["paper_start_cash"], "positions": {}})
        broker = PaperBroker(state, cfg["fee_pct"], cfg["slippage_pct"])

    state = run(cfg, CcxtMarket(ex), broker, state, dry_run=dry_run)
    if not dry_run:
        save_json(state_path, state)


if __name__ == "__main__":
    main()
