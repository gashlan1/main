#!/usr/bin/env python3
"""Daily trend-following study: a pre-registered alternative to the 4h/1h
trend-pullback strategy, run on the same data that backtest_runner.py downloads
(bt/data/*.csv) and compared on the same in-sample / out-of-sample split.

Rules were fixed before any result was seen. Both are classic, widely published:
  sma200      long while the daily close is above its 200-day simple moving average,
              otherwise cash
  sma200+mom  the same, and the close must also be above the close 90 days earlier
Position: 100% of equity when long, spot, no leverage. The signal is read at the
daily close and filled at the next day's first bar open. One fee per side
(fee_pct, the same as the main study). Max drawdown is measured on daily closes.

  python research/daily_trend_study.py --base bt > bt/daily_trend.md
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

SMA = 200
MOM = 90
EQUITY = 10_000.0
MIN_BARS_PER_DAY = {"XAUUSD": 12}  # drop Sunday-evening stubs and holiday half-days
MARKETS = {
    "BTC": ("BTCUSDT_4h.csv", 0.31),
    "ETH": ("ETHUSDT_4h.csv", 0.31),
    "SOL": ("SOLUSDT_4h.csv", 0.31),
    "XAUUSD": ("XAUUSD_H1.csv", 0.02),
}
VARIANTS = {"sma200": False, "sma200+mom": True}


def load_candles(path):
    rows = []
    with open(path) as f:
        next(f)
        for line in f:
            t, o, h, l, c, v = line.split(",")
            rows.append([int(t), float(o), float(h), float(l), float(c), float(v)])
    return rows


def day_start(ts_ms):
    return ts_ms - ts_ms % 86_400_000


def to_daily(candles, min_bars=1):
    """Aggregate intraday bars into UTC days: [day_ts, open, high, low, close, volume, bars]."""
    days = []
    for c in candles:
        d = day_start(c[0])
        if days and days[-1][0] == d:
            x = days[-1]
            x[2], x[3], x[4], x[5], x[6] = max(x[2], c[2]), min(x[3], c[3]), c[4], x[5] + c[5], x[6] + 1
        else:
            days.append([d, c[1], c[2], c[3], c[4], c[5], 1])
    return [d for d in days if d[6] >= min_bars]


def sma_series(values, n):
    out, acc = [None] * len(values), 0.0
    for i, v in enumerate(values):
        acc += v
        if i >= n:
            acc -= values[i - n]
        if i >= n - 1:
            out[i] = acc / n
    return out


def run(daily, fee_pct, use_mom, start):
    """Trade from index `start` (earlier bars only warm the indicators). Returns stats."""
    fee = fee_pct / 100
    closes = [d[4] for d in daily]
    sma = sma_series(closes, SMA)
    cash, units, pending = EQUITY, 0.0, None
    curve, trades, long_days = [], 0, 0
    for i in range(start, len(daily)):
        o, c = daily[i][1], daily[i][4]
        if pending == "buy" and units == 0:
            units, cash = cash * (1 - fee) / o, 0.0
        elif pending == "sell" and units > 0:
            cash, units, trades = units * o * (1 - fee), 0.0, trades + 1
        pending = None
        equity = cash + units * c
        curve.append(equity)
        long_days += units > 0
        if sma[i] is None or (use_mom and i < MOM):
            continue
        want = c > sma[i] and (not use_mom or c > closes[i - MOM])
        if want and units == 0:
            pending = "buy"
        elif not want and units > 0:
            pending = "sell"
    final = curve[-1]
    peak, dd = EQUITY, 0.0
    for v in curve:
        peak = max(peak, v)
        dd = max(dd, (peak - v) / peak * 100)
    years = (daily[-1][0] - daily[start][0]) / 86_400_000 / 365.25
    return {
        "return_pct": round((final / EQUITY - 1) * 100, 2),
        "cagr_pct": round(((final / EQUITY) ** (1 / years) - 1) * 100, 2) if years > 0.5 else None,
        "max_drawdown_pct": round(dd, 2),
        "round_trips": trades + (1 if units > 0 else 0),
        "open_at_end": units > 0,
        "time_long_pct": round(long_days / len(curve) * 100, 1),
        "days": len(curve),
    }


def buy_and_hold(daily, fee_pct, start):
    fee = fee_pct / 100
    units = EQUITY * (1 - fee) / daily[start][1]
    curve = [units * d[4] for d in daily[start:]]
    curve[-1] *= 1 - fee
    peak, dd = EQUITY, 0.0
    for v in curve:
        peak = max(peak, v)
        dd = max(dd, (peak - v) / peak * 100)
    return {"return_pct": round((curve[-1] / EQUITY - 1) * 100, 2), "max_drawdown_pct": round(dd, 2)}


def parse_split(text):
    return int(datetime.strptime(text, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc).timestamp() * 1000)


def windows(daily, split_ts):
    """(name, start index, slice): full, in-sample, out-of-sample. The out-of-sample
    run gets SMA+MOM earlier days prepended so the indicators are warm at the split."""
    split_day = day_start(split_ts)
    k = next(i for i, d in enumerate(daily) if d[0] >= split_day)
    warm = SMA + MOM
    return [("full", 0, daily), ("in-sample", 0, daily[:k]),
            ("out-of-sample", warm, daily[k - warm:])] if k > warm else [("full", 0, daily)]


def fmt_date(ts):
    return datetime.fromtimestamp(ts / 1000, timezone.utc).strftime("%Y-%m-%d")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default="bt")
    a = ap.parse_args()
    base = Path(a.base)
    baseline = json.loads((base / "results" / "baseline.json").read_text())

    out = {}
    lines = [f"Daily trend-following study (rules fixed in advance; SMA {SMA} days, momentum {MOM} days; "
             "100% long or cash; fills at next day's open).",
             "",
             "| Market | Window | Dates (UTC) | Days | sma200: return % / max DD % / trips / % long | "
             "sma200+mom: return % / max DD % / trips / % long | Buy & hold: return % / max DD % | "
             "Pullback bot (main study): return % / max DD % |",
             "|---|---|---|---|---|---|---|---|"]
    for name, (csv, fee_pct) in MARKETS.items():
        path = base / "data" / csv
        if not path.exists() or "error" in baseline.get(name, {"error": 1}):
            lines.append(f"| {name} | - | no data | | | | | |")
            continue
        daily = to_daily(load_candles(path), MIN_BARS_PER_DAY.get(name, 1))
        split_ts = parse_split(baseline[name]["split_bar"])
        out[name] = {"daily_bars": len(daily), "fee_pct": fee_pct, "split_bar": baseline[name]["split_bar"], "windows": {}}
        for wname, start, cs in windows(daily, split_ts):
            res = {v: run(cs, fee_pct, use_mom, start) for v, use_mom in VARIANTS.items()}
            bh = buy_and_hold(cs, fee_pct, start)
            pb = baseline[name]["windows"][wname.replace("-", "_")]["result"]
            out[name]["windows"][wname] = {**res, "buy_and_hold": bh, "pullback_bot": {
                "return_pct": pb["return_pct"], "max_drawdown_pct": pb["max_drawdown_pct"], "trades": pb["trades"]}}
            cell = lambda r: f"{r['return_pct']:.2f} / {r['max_drawdown_pct']:.2f} / {r['round_trips']} / {r['time_long_pct']}"
            lines.append(f"| {name} | {wname} | {fmt_date(cs[start][0])} to {fmt_date(cs[-1][0])} | {len(cs) - start} | "
                         f"{cell(res['sma200'])} | {cell(res['sma200+mom'])} | "
                         f"{bh['return_pct']:.2f} / {bh['max_drawdown_pct']:.2f} | "
                         f"{pb['return_pct']:.2f} / {pb['max_drawdown_pct']:.2f} |")
    lines += ["", "Caveats: one fee per side and no other slippage; 100% allocation is the simplest comparable "
              "sizing, not a recommendation; gold uses bid prices and 1x notional (no leverage); 'trips' counts "
              "round trips including a position still open at the end; past results do not predict live results."]
    (base / "results" / "daily_trend.json").write_text(json.dumps(out, indent=1))
    print("\n".join(lines))


if __name__ == "__main__":
    main()
