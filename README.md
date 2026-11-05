# Trading bots

Three autonomous bots, all **paper/demo by default**, each with hard risk limits and a kill switch.

| Bot | Market | Runs on | Code | Settings |
|---|---|---|---|---|
| Stocks | US ETFs via Alpaca | GitHub Actions, hourly in market hours | `bot/trader.py` | `config.json` |
| Crypto | BTC, ETH, SOL spot via ccxt (Kraken) | GitHub Actions, hourly | `trading/crypto_bot.py` | `config/crypto.json` |
| Gold | XAUUSD on MetaTrader 5 | Your MT5 terminal / Windows VPS | `mt5/XAUUSD_TrendPullback.mq5` | EA inputs |

Crypto and gold share one strategy (`trading/strategy.py`), a **trend-pullback**: trade only
with the trend (EMA50 vs EMA200), enter when RSI recovers from a pullback, ATR-based stop and
target, trailing stop, exit when the trend breaks, and size every trade so a stop-out loses a
fixed % of equity.

Claude skills in `.claude/skills/`: `trader` (stocks), `crypto-trader`, `mt5-gold-trader`,
`strategy-lab` (backtesting and safe tuning).

**Status (2026-11-05):** the first backtests on real 2021–2026 data show the current
trend-pullback strategy loses money on all four markets, in and out of sample
(`research/backtests/2026-11-05/report.md`). A daily 200-day trend rule did much better on
the same data. See `research/IMPROVEMENT_PLAN.md` before changing anything or trading real
money. The bots stay in paper mode.

## Crypto bot setup

Paper mode needs **no keys**. Merge to the default branch and it starts on the next hour,
simulating fills on live Kraken prices with $10,000 of paper cash. Portfolio:
`state/crypto_paper.json`. Log: `logs/crypto.jsonl`. Try it first via **Actions → crypto → Run
workflow** with `dry_run`.

Live (only after paper results you're happy with): create exchange API keys with **trading
only, withdrawals disabled**, add secrets `EXCHANGE_API_KEY` / `EXCHANGE_API_SECRET`, set
`"mode": "live"`, and add repo variable `ALLOW_LIVE_CRYPTO=yes`. Note that Binance and Bybit
block US IPs, so GitHub-hosted runners can't reach them.

## Gold EA setup (MT5)

1. Open a **demo** account with an MT5 broker.
2. MT5 → File → Open Data Folder → `MQL5/Experts/`, copy in `mt5/XAUUSD_TrendPullback.mq5`.
3. Open it in MetaEditor (F4) and press Compile (F7).
4. Turn on **Algo Trading**, then drag the EA onto an XAUUSD chart.
5. Backtest first in the Strategy Tester (Ctrl+R) on 2+ years of H1 data.
6. To run 24/5, host MT5 on a Windows VPS.

Defaults: 0.5% risk per trade, 2% daily loss lock, max 2 trades/day, spread filter, trades
08:00–20:00 server time, closes before the weekend.

## Stocks bot setup

Add Alpaca **paper** keys as secrets `ALPACA_API_KEY` / `ALPACA_SECRET_KEY`. Live requires
`"mode": "live"` in `config.json` and repo variable `ALLOW_LIVE=yes`.

## Backtesting

```
python -m trading.backtest --exchange kraken --symbol BTC/USD --timeframe 4h
python -m trading.backtest --csv XAUUSD_H1.csv --fee-pct 0.02
```

## Tests

```
pip install -r requirements.txt
python -m unittest discover -s tests -t .
```

**Risk warning:** no strategy is guaranteed to make money. Backtests and paper results
overstate live performance. Only trade real money you can afford to lose.
