---
name: strategy-lab
description: Backtest, compare and safely tune trading strategy parameters for the crypto bot and the gold EA. Use when asked to improve, optimise, test or compare a trading strategy, or whether a change would have made money.
---

# Strategy lab skill

Tool: `python -m trading.backtest` (see `--help`). Uses the exact `trading/strategy.py` code
the crypto bot runs, so a backtest result is the bot's logic, not an approximation.

```
python -m trading.backtest --exchange kraken --symbol BTC/USD --timeframe 4h --limit 720
python -m trading.backtest --csv XAUUSD_H1.csv --fee-pct 0.02 --params '{"stop_atr":1.5}'
```

Reports: trades, return %, max drawdown %, win rate, profit factor, avg trade, final equity.
`--trades` prints every trade.

## How to tune without fooling yourself

1. **Baseline first.** Run current settings and record the result.
2. **Change one parameter at a time**, in small steps, and run each.
3. **Split the data.** Tune on the older ~70%, then run the chosen settings once on the newest
   ~30% (out-of-sample). If it falls apart there, reject the change.
4. **Prefer robustness over the peak.** Choose settings whose neighbours also do well, not a
   single spike.
5. **Judge drawdown, not just return.** Reject anything with max drawdown worse than about 2× the
   baseline, or fewer than ~30 trades (too few to mean anything).
6. Fees: use the real taker fee (`--fee-pct`; Kraken ~0.26, Binance ~0.1, gold CFD spread ≈ 0.02).
7. Show the user a before/after table and **ask before committing** a parameter change.

Backtests ignore slippage beyond fees, partial fills and outages. Expect live results to be
worse. Never present a backtest as a promise of future returns.

## Full study on real history (preferred)

`research/backtest_runner.py` downloads real data (Binance 4h for BTC/ETH/SOL, Dukascopy H1
for XAUUSD), runs baseline / in-sample / out-of-sample / buy-and-hold / a 27-cell robustness
grid, and writes markdown tables. Run it with the **backtest** GitHub Action (Actions → backtest
→ Run workflow); it commits the report to `research/backtests/<date>/report.md`. Cloud sessions
can't reach the data hosts directly, so always use the Action for real data. Read the latest
report before proposing any parameter change.
