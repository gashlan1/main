---
name: trader
description: Operate, review and tune the autonomous Alpaca trading bot in this repo. Use when asked about trades, performance, risk limits, the watchlist, the strategy, pausing/resuming trading, or switching between paper and live.
---

# Trader skill

The bot in `bot/trader.py` runs on a GitHub Actions schedule (`.github/workflows/trade.yml`)
twice each weekday and trades through Alpaca. All settings live in `config.json`.

## Hard rules (never break these)

1. **Never switch `mode` to `"live"`** unless the user explicitly asks for live trading in their
   own words in this conversation. Live also requires the repo variable `ALLOW_LIVE=yes`.
2. **Never raise a limit in `config.risk`** without the user's explicit approval of the new number.
   Lowering limits or pausing is always allowed.
3. **Never put API keys in files or commits.** They live only in GitHub secrets.
4. Run `python -m unittest discover -s tests` before committing any change to the bot.

## Common tasks

- **Pause everything (kill switch):** set `"trading_enabled": false` in `config.json`, commit, push.
- **Review performance:** read `logs/trades.jsonl` (one JSON event per line: `buy`, `sell`,
  `skip`, `halt`, `summary`). Report equity trend from `summary` events, number of trades,
  and any `halt` events. Don't claim profits you can't see in the log.
- **Change the watchlist:** edit `watchlist`. Prefer liquid ETFs and large caps.
- **Tune the strategy:** `strategy.fast_sma` / `slow_sma` (daily bars). Must keep fast < slow.
- **Dry run:** trigger the workflow manually with `dry_run: true`, or run locally with `DRY_RUN=1`.

## How the bot decides

- Fast SMA > slow SMA and no position → buy `min(max_trade_usd, room under max_total_exposure_usd, buying power)`.
- Fast SMA < slow SMA and holding → close the whole position.
- If today's equity is down `max_daily_loss_pct` or more versus yesterday's close → no new buys
  (sells still allowed).
- Market closed or kill switch off → does nothing.
