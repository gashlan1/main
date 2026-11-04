"""Backtest the trend-pullback strategy on exchange data or a CSV.

  python -m trading.backtest --exchange kraken --symbol BTC/USD --timeframe 4h
  python -m trading.backtest --csv XAUUSD_H1.csv            # e.g. exported from MT5

CSV columns: time,open,high,low,close[,volume] (header row optional; MT5's
tab-separated <DATE> <TIME> export is also accepted).

Fills: entries at the next candle's open, stops/targets at their level,
fees charged on both sides. Results are optimistic compared with live
trading (no slippage beyond fees, no partial fills).
"""

import argparse
import csv
import json
import math
from datetime import datetime

from trading import strategy


def run_backtest(candles, params=None, equity=10_000.0, fee_pct=0.1):
    p = {**strategy.DEFAULTS, **(params or {})}
    ind = strategy.indicators(candles, p)
    fee = fee_pct / 100
    start_equity = equity
    position, pending_entry = None, False
    trades, curve = [], []

    for i, c in enumerate(candles):
        if pending_entry and position is None:
            price = c[1]
            levels = strategy.open_levels(price, ind["atr"][i - 1], p)
            units = strategy.position_size(equity, price, levels["stop"], p)
            if units > 0:
                equity -= units * price * fee
                position = {"entry": price, "units": units, "time": c[0], **levels}
            pending_entry = False

        if position is not None:
            action, value, reason = strategy.manage(position, c, ind, i, p)
            if action == "exit":
                pnl = (value - position["entry"]) * position["units"] - value * position["units"] * fee
                equity += pnl
                trades.append({"entry_time": position["time"], "exit_time": c[0],
                               "entry": position["entry"], "exit": value,
                               "pnl": pnl, "reason": reason})
                position = None
            else:
                position["stop"] = value

        if position is None and strategy.entry_signal(ind, i, p):
            pending_entry = True

        mark = equity + ((c[4] - position["entry"]) * position["units"] if position else 0)
        curve.append(mark)

    return summarize(trades, curve, start_equity)


def summarize(trades, curve, start_equity):
    wins = [t["pnl"] for t in trades if t["pnl"] > 0]
    losses = [t["pnl"] for t in trades if t["pnl"] <= 0]
    peak, max_dd = start_equity, 0.0
    for v in curve:
        peak = max(peak, v)
        max_dd = max(max_dd, (peak - v) / peak * 100)
    final = curve[-1] if curve else start_equity
    return {
        "trades": len(trades),
        "return_pct": round((final / start_equity - 1) * 100, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "win_rate_pct": round(len(wins) / len(trades) * 100, 1) if trades else 0.0,
        "profit_factor": round(sum(wins) / -sum(losses), 2) if losses and sum(losses) else (math.inf if wins else 0.0),
        "avg_trade": round(sum(t["pnl"] for t in trades) / len(trades), 2) if trades else 0.0,
        "final_equity": round(final, 2),
        "trade_list": trades,
    }


def load_csv(path):
    candles = []
    with open(path, newline="") as f:
        sample = f.read(2048)
        f.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;")
        for row in csv.reader(f, dialect):
            if not row or not row[0][:1].isdigit():
                continue
            # MT5 export: date, time, open, high, low, close, ...
            if len(row) >= 6 and ":" in row[1]:
                ts = datetime.strptime(f"{row[0]} {row[1][:5]}", "%Y.%m.%d %H:%M").timestamp() * 1000
                o, h, l, c = map(float, row[2:6])
            else:
                ts = float(row[0]) if row[0].replace(".", "").isdigit() else \
                    datetime.fromisoformat(row[0]).timestamp() * 1000
                o, h, l, c = map(float, row[1:5])
            candles.append([ts, o, h, l, c, 0.0])
    return candles


def fetch(exchange, symbol, timeframe, limit):
    import ccxt
    ex = getattr(ccxt, exchange)({"enableRateLimit": True})
    return ex.fetch_ohlcv(symbol, timeframe, limit=limit)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv")
    ap.add_argument("--exchange", default="kraken")
    ap.add_argument("--symbol", default="BTC/USD")
    ap.add_argument("--timeframe", default="4h")
    ap.add_argument("--limit", type=int, default=720)
    ap.add_argument("--fee-pct", type=float, default=0.1)
    ap.add_argument("--params", default="{}", help='JSON overrides, e.g. \'{"stop_atr": 1.5}\'')
    ap.add_argument("--trades", action="store_true", help="print every trade")
    a = ap.parse_args()

    candles = load_csv(a.csv) if a.csv else fetch(a.exchange, a.symbol, a.timeframe, a.limit)
    result = run_backtest(candles, json.loads(a.params), fee_pct=a.fee_pct)
    trades = result.pop("trade_list")
    print(json.dumps({"candles": len(candles), **result}, indent=2))
    if a.trades:
        for t in trades:
            print(json.dumps(t))


if __name__ == "__main__":
    main()
