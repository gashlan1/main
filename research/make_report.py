#!/usr/bin/env python3
"""Performance charts and a PDF report from the backtest data in bt/.

Recomputes equity curves on the full period with the same code as the studies:
  buy & hold, daily SMA200, daily SMA200+momentum (research/daily_trend_study.py),
  and the live pullback bot (trading/backtest.py, realized P&L at each exit).

  python research/make_report.py --base bt --out research/backtests/<date>
writes <out>/charts/*.png and <out>/report.pdf.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import daily_trend_study as dts  # noqa: E402
from trading import backtest, strategy  # noqa: E402

EQUITY = 10_000.0
LIVE = {
    "BTC": {"risk_pct": 1.0, "max_position_pct": 25.0},
    "ETH": {"risk_pct": 1.0, "max_position_pct": 25.0},
    "SOL": {"risk_pct": 1.0, "max_position_pct": 25.0},
    "XAUUSD": {"stop_atr": 1.5, "target_atr": 3.0, "trail_atr": 2.0, "risk_pct": 0.5, "max_position_pct": 3000},
}
STYLE = {
    "Buy & hold": ("#9aa0a6", 1.2),
    "Daily SMA200": ("#1a73e8", 1.6),
    "SMA200 + momentum": ("#188038", 1.6),
    "Pullback bot (current)": ("#d93025", 1.6),
}


def dt(ts):
    return datetime.fromtimestamp(ts / 1000, timezone.utc)


def drawdown(curve):
    peak, out = curve[0], []
    for v in curve:
        peak = max(peak, v)
        out.append((v / peak - 1) * 100)
    return out


def curves(name, csv, fee_pct, base):
    candles = dts.load_candles(base / "data" / csv)
    daily = dts.to_daily(candles, dts.MIN_BARS_PER_DAY.get(name, 1))
    days = [dt(d[0]) for d in daily]
    units = EQUITY * (1 - fee_pct / 100) / daily[0][1]
    out = {"Buy & hold": [units * d[4] for d in daily]}
    for label, mom in (("Daily SMA200", False), ("SMA200 + momentum", True)):
        out[label] = dts.run(daily, fee_pct, mom, 0, with_curve=True)["curve"]
    res = backtest.run_backtest(candles, LIVE[name], equity=EQUITY, fee_pct=fee_pct)
    exits = sorted((t["exit_time"], t["pnl"]) for t in res["trade_list"])
    eq, k, bot = EQUITY, 0, []
    for d in daily:
        while k < len(exits) and exits[k][0] < d[0] + 86_400_000:
            eq += exits[k][1]
            k += 1
        bot.append(eq)
    out["Pullback bot (current)"] = bot
    return days, out


def stats(curve):
    return (curve[-1] / curve[0] - 1) * 100, -min(drawdown(curve))


def market_figure(name, days, cv):
    fig, (ax, ax2) = plt.subplots(2, 1, figsize=(11, 7.5), sharex=True,
                                  gridspec_kw={"height_ratios": [3, 1.3]})
    for label, curve in cv.items():
        color, lw = STYLE[label]
        r, d = stats(curve)
        ax.plot(days, curve, color=color, lw=lw, label=f"{label}: {r:+.0f}%  (worst fall {d:.0f}%)")
        ax2.plot(days, drawdown(curve), color=color, lw=1.1)
    ax.set_yscale("log")
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"${v:,.0f}"))
    ax.set_title(f"{name}: $10,000 starting equity, {days[0]:%b %Y} to {days[-1]:%b %Y}", loc="left", fontsize=13)
    ax.legend(loc="upper left", fontsize=9, frameon=False)
    ax.grid(alpha=0.25)
    ax2.set_ylabel("Drawdown %")
    ax2.grid(alpha=0.25)
    ax2.xaxis.set_major_locator(mdates.YearLocator())
    ax2.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
    for a in (ax, ax2):
        a.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


def summary_figure(rows):
    fig, axes = plt.subplots(1, 2, figsize=(11, 5))
    names = list(rows)
    labels = list(STYLE)
    width = 0.2
    for j, metric in enumerate(("Return %", "Worst fall %")):
        ax = axes[j]
        for i, label in enumerate(labels):
            vals = [rows[n][label][j] for n in names]
            xs = [x + (i - 1.5) * width for x in range(len(names))]
            ax.bar(xs, vals, width, color=STYLE[label][0], label=label)
        ax.set_xticks(range(len(names)), names)
        ax.set_title(metric + " (full period)", loc="left")
        ax.grid(axis="y", alpha=0.25)
        ax.spines[["top", "right"]].set_visible(False)
        if j == 0:
            ax.set_yscale("symlog", linthresh=100)
    axes[0].legend(fontsize=8, frameon=False)
    fig.tight_layout()
    return fig


def text_page(lines, title):
    fig = plt.figure(figsize=(11, 8.5))
    fig.text(0.06, 0.93, title, fontsize=18, weight="bold")
    y = 0.86
    for line in lines:
        fig.text(0.06, y, line, fontsize=10.5, family="monospace" if line.startswith("|") or line.startswith(" ") else None)
        y -= 0.034
    return fig


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="bt")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    base, out = Path(a.base), Path(a.out)
    (out / "charts").mkdir(parents=True, exist_ok=True)

    figs, rows = [], {}
    for name, (csv, fee_pct) in dts.MARKETS.items():
        if not (base / "data" / csv).exists():
            continue
        days, cv = curves(name, csv, fee_pct, base)
        rows[name] = {k: stats(v) for k, v in cv.items()}
        fig = market_figure(name, days, cv)
        fig.savefig(out / "charts" / f"{name}.png", dpi=130)
        figs.append(fig)
    summ = summary_figure(rows)
    summ.savefig(out / "charts" / "summary.png", dpi=130)

    table = [f"{'Market':<8}{'Strategy':<26}{'Return %':>10}{'Worst fall %':>15}"]
    for n, r in rows.items():
        for label, (ret, dd) in r.items():
            table.append(f"{n:<8}{label:<26}{ret:>10.1f}{dd:>15.1f}")
        table.append("")
    intro = [
        f"Generated {datetime.now(timezone.utc):%Y-%m-%d} from real history (Binance 4h crypto, Dukascopy H1 gold).",
        "Full period, $10,000 start, one fee per side. Daily rules: 100% long or cash.",
        "Pullback bot = the strategy the bots run today (realized P&L at each exit).",
        "",
    ] + ["  " + t for t in table] + [
        "Past results do not predict live results. Paper trading only until reviewed.",
    ]
    with PdfPages(out / "report.pdf") as pdf:
        pdf.savefig(text_page(intro, "Trading bots: backtest performance"))
        pdf.savefig(summ)
        for f in figs:
            pdf.savefig(f)
    (out / "charts" / "summary.json").write_text(json.dumps(rows, indent=1))
    print(f"wrote {out / 'report.pdf'} and {len(figs) + 1} charts")


if __name__ == "__main__":
    main()
