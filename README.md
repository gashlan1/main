# Autonomous paper trader

A trend-following bot that trades US ETFs through [Alpaca](https://alpaca.markets) on a schedule,
with hard risk limits. **It starts in paper-trading mode (simulated money).**

## Setup (about 5 minutes)

1. Create a free Alpaca account and open the **Paper Trading** dashboard.
2. Generate paper API keys.
3. In this GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - `ALPACA_API_KEY`
   - `ALPACA_SECRET_KEY`
4. Merge this branch into your default branch (scheduled workflows only run from the default branch).
5. Optional: **Actions → trade → Run workflow** with `dry_run` checked to test it.

From then on it runs every weekday at about 14:45 and 19:30 UTC and commits every decision to
`logs/trades.jsonl`.

## Settings (`config.json`)

| Setting | Default | Meaning |
|---|---|---|
| `trading_enabled` | `true` | Kill switch. Set `false` to stop all trading. |
| `mode` | `paper` | `live` also needs repo variable `ALLOW_LIVE=yes`. |
| `watchlist` | SPY, QQQ, IWM, DIA | Symbols the bot may trade. |
| `strategy.fast_sma` / `slow_sma` | 20 / 50 | Buy when fast > slow, sell when fast < slow. |
| `risk.max_trade_usd` | 1000 | Max dollars per buy. |
| `risk.max_total_exposure_usd` | 4000 | Max dollars invested at once. |
| `risk.max_daily_loss_pct` | 2.0 | Stop new buys after this daily drop. |

## Going live

Only after weeks of paper results you're happy with: swap the secrets for live keys, set
`"mode": "live"`, and add repository **variable** `ALLOW_LIVE` = `yes`. Only risk money you can
afford to lose. Past paper results don't guarantee live results.

## Tests

```
python -m unittest discover -s tests
```
