"""Autonomous trend-following trader for Alpaca (paper trading by default).

Strategy: buy a symbol when its fast SMA is above its slow SMA, sell the whole
position when it crosses back below. Every order passes through hard risk
limits from config.json before it is sent.

Environment:
  ALPACA_API_KEY, ALPACA_SECRET_KEY  broker credentials (required to trade)
  ALLOW_LIVE=yes                     also required when config mode is "live"
  DRY_RUN=1                          compute decisions but send no orders
"""

import datetime as dt
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
PAPER_URL = "https://paper-api.alpaca.markets"
LIVE_URL = "https://api.alpaca.markets"
DATA_URL = "https://data.alpaca.markets"


def load_config(path=ROOT / "config.json"):
    with open(path) as f:
        return json.load(f)


def sma(values, n):
    if len(values) < n:
        return None
    return sum(values[-n:]) / n


def signal(closes, fast, slow):
    """Return "buy", "sell" or None for a list of daily closes."""
    f, s = sma(closes, fast), sma(closes, slow)
    if f is None or s is None:
        return None
    if f > s:
        return "buy"
    if f < s:
        return "sell"
    return None


def daily_loss_pct(equity, last_equity):
    if last_equity <= 0:
        return 0.0
    return max(0.0, (last_equity - equity) / last_equity * 100)


def buy_amount(risk, exposure, buying_power):
    """Dollars to spend on one new buy, or 0 if limits leave no room."""
    room = risk["max_total_exposure_usd"] - exposure
    amount = min(risk["max_trade_usd"], room, buying_power)
    return round(amount, 2) if amount >= 1 else 0


class Alpaca:
    def __init__(self, base_url, key, secret):
        self.base_url = base_url
        self.s = requests.Session()
        self.s.headers.update({"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret})

    def _get(self, url, **params):
        r = self.s.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()

    def account(self):
        return self._get(f"{self.base_url}/v2/account")

    def clock(self):
        return self._get(f"{self.base_url}/v2/clock")

    def positions(self):
        return {p["symbol"]: p for p in self._get(f"{self.base_url}/v2/positions")}

    def closes(self, symbol, days=120):
        start = (dt.date.today() - dt.timedelta(days=days)).isoformat()
        data = self._get(f"{DATA_URL}/v2/stocks/{symbol}/bars",
                         timeframe="1Day", start=start, feed="iex", limit=1000)
        return [b["c"] for b in data.get("bars") or []]

    def buy_notional(self, symbol, usd):
        return self._order({"symbol": symbol, "notional": str(usd), "side": "buy",
                            "type": "market", "time_in_force": "day"})

    def close_position(self, symbol):
        r = self.s.delete(f"{self.base_url}/v2/positions/{symbol}", timeout=30)
        r.raise_for_status()
        return r.json()

    def _order(self, body):
        r = self.s.post(f"{self.base_url}/v2/orders", json=body, timeout=30)
        r.raise_for_status()
        return r.json()


def log(event):
    event["time"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    print(json.dumps(event))
    logs = ROOT / "logs"
    logs.mkdir(exist_ok=True)
    with open(logs / "trades.jsonl", "a") as f:
        f.write(json.dumps(event) + "\n")


def run(cfg, broker, dry_run=False):
    if not cfg.get("trading_enabled", False):
        log({"event": "skip", "reason": "trading_enabled is false (kill switch)"})
        return

    if not broker.clock().get("is_open"):
        log({"event": "skip", "reason": "market closed"})
        return

    acct = broker.account()
    equity, last_equity = float(acct["equity"]), float(acct["last_equity"])
    loss = daily_loss_pct(equity, last_equity)
    halted = loss >= cfg["risk"]["max_daily_loss_pct"]
    if halted:
        log({"event": "halt", "reason": f"daily loss {loss:.2f}% hit limit; no new buys"})

    positions = broker.positions()
    exposure = sum(abs(float(p["market_value"])) for p in positions.values())
    buying_power = float(acct["buying_power"])
    fast, slow = cfg["strategy"]["fast_sma"], cfg["strategy"]["slow_sma"]

    for symbol in cfg["watchlist"]:
        sig = signal(broker.closes(symbol), fast, slow)
        held = symbol in positions

        if sig == "sell" and held:
            log({"event": "sell", "symbol": symbol, "dry_run": dry_run})
            if not dry_run:
                broker.close_position(symbol)
        elif sig == "buy" and not held and not halted:
            usd = buy_amount(cfg["risk"], exposure, buying_power)
            if usd == 0:
                log({"event": "skip", "symbol": symbol, "reason": "risk limits reached"})
                continue
            log({"event": "buy", "symbol": symbol, "usd": usd, "dry_run": dry_run})
            if not dry_run:
                broker.buy_notional(symbol, usd)
            exposure += usd
            buying_power -= usd

    log({"event": "summary", "equity": equity, "exposure": round(exposure, 2),
         "daily_loss_pct": round(loss, 2), "mode": cfg["mode"]})


def main():
    cfg = load_config()
    key, secret = os.getenv("ALPACA_API_KEY"), os.getenv("ALPACA_SECRET_KEY")
    if not key or not secret:
        sys.exit("ALPACA_API_KEY and ALPACA_SECRET_KEY must be set")

    if cfg["mode"] == "live":
        if os.getenv("ALLOW_LIVE") != "yes":
            sys.exit("config mode is live but ALLOW_LIVE=yes is not set; refusing")
        base = LIVE_URL
    else:
        base = PAPER_URL

    run(cfg, Alpaca(base, key, secret), dry_run=os.getenv("DRY_RUN") == "1")


if __name__ == "__main__":
    main()
