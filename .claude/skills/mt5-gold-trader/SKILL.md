---
name: mt5-gold-trader
description: Install, configure, backtest and tune the XAUUSD (gold) Expert Advisor for MetaTrader 5. Use when asked about gold/XAUUSD trading, MT5, the Expert Advisor, the Strategy Tester, or VPS setup for MT5.
---

# MT5 gold trader skill

- EA source: `mt5/XAUUSD_TrendPullback.mq5`
- Reference logic (same rules, long side): `trading/strategy.py`
- The EA runs **inside the user's MT5 terminal** (their PC or a Windows VPS). It can't run on
  GitHub Actions, and this cloud session can't reach their broker.

## Hard rules

1. **Demo account first.** Never tell the user to attach the EA to a live account until they've
   run it on demo for at least a few weeks and reviewed the results with you.
2. **Never raise `InpRiskPct` above 1.0 or `InpMaxDailyLossPct` above 3.0** without the user
   approving the exact number. Gold moves fast; 0.5% risk is the default for a reason.
3. Any change to entry/exit rules: change `strategy.py` and the EA together so they stay in
   sync, and backtest before/after (strategy-lab skill or MT5 Strategy Tester).
4. You can't compile MQL5 here. After editing the EA, tell the user to press **Compile (F7)** in
   MetaEditor and paste back any errors.

## Install (walk the user through this)

1. MT5 → **File → Open Data Folder** → `MQL5/Experts/`, copy `XAUUSD_TrendPullback.mq5` in.
2. Open it in MetaEditor (F4), press **Compile**. There should be 0 errors.
3. In MT5, enable the **Algo Trading** button on the toolbar.
4. Open an XAUUSD chart (any timeframe; the EA uses `InpTimeframe`, default H1), drag the EA
   onto it, tick **Allow Algo Trading**, set inputs, click OK.
5. Check the **Experts** tab for "BUY/SELL ... -> ok" or "Skip: ..." messages.
6. To run 24/5 without their PC on, use a Windows VPS near the broker's server (many brokers
   offer one, or the built-in MQL5 VPS).

Symbol names vary by broker (`XAUUSD`, `XAUUSD.m`, `GOLD`). The EA trades the chart's symbol.

## Backtest

- **MT5 Strategy Tester** (Ctrl+R): Expert = XAUUSD_TrendPullback, symbol XAUUSD, H1,
  "Every tick based on real ticks", at least 2 years. Use *Optimization* sparingly and check the
  best settings on a later out-of-sample period. Over-optimised settings fail live.
- **Python cross-check:** export bars (MT5 → View → Symbols → Bars → XAUUSD, H1 → Export) and run
  `python -m trading.backtest --csv XAUUSD_H1.csv --fee-pct 0.02` with the same parameters
  (`--params '{"stop_atr":1.5,"target_atr":3.0,"trail_atr":2.0,"risk_pct":0.5}'`).

## Inputs that matter most

| Input | Default | Notes |
|---|---|---|
| `InpRiskPct` | 0.5 | % equity lost at stop. If lots come out below the broker minimum, the EA skips the trade instead of oversizing. |
| `InpMaxDailyLossPct` | 2.0 | Closes the position and stops for the day. |
| `InpMaxSpreadPoints` | 60 | Gold spreads widen at rollover and on news; this blocks entries then. Set it to about 2× the broker's normal spread. |
| `InpStartHour`/`InpEndHour` | 8–20 | Broker server time; London + New York sessions. |
| `InpAllowShorts` | false | Mirror short rules. Enable only after testing it. |
| `InpMagic` | 20261104 | Change if running several copies. |

High-impact news (US CPI, NFP, FOMC) can gap through stops. Suggest the user disables the EA
around those releases or lowers risk.
