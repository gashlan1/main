---
name: crypto-trader
description: Operate, review and tune the autonomous crypto spot bot (BTC/ETH/SOL via ccxt, paper by default). Use when asked about crypto trades, crypto performance, the crypto watchlist or exchange, pausing crypto trading, or moving crypto from paper to live.
---

# Crypto trader skill

- Code: `trading/crypto_bot.py` (bot), `trading/strategy.py` (shared strategy)
- Settings: `config/crypto.json`
- Schedule: `.github/workflows/crypto.yml`, hourly
- Paper portfolio: `state/crypto_paper.json` (cash, open positions with stop/target, closed trades)
- Log: `logs/crypto.jsonl` (`buy`, `sell`, `closed`, `skip`, `halt`, `summary` events)

## Hard rules

1. **Paper unless the user explicitly says, in this conversation, to trade real money.** Live
   also needs repo variable `ALLOW_LIVE_CRYPTO=yes` and secrets `EXCHANGE_API_KEY` /
   `EXCHANGE_API_SECRET`. Tell the user to create keys with **trade permission only, withdrawals
   disabled**, and IP-restricted if the exchange allows it.
2. **Never raise `strategy.risk_pct`, `max_position_pct`, or anything under `risk`** without
   the user approving the exact new number. Lowering or pausing is always fine.
3. **Never commit keys.** They live only in GitHub secrets.
4. Before changing strategy parameters, backtest old vs new with the `strategy-lab` skill and
   show both results. Run `python -m unittest discover -s tests -t .` before every commit.
5. Never report profits that aren't in the state file or log.

## Common tasks

- **Pause:** `"trading_enabled": false` in `config/crypto.json`, commit, push. Open positions
  are left as they are; to flatten, tell the user and, with their OK, close them in a run.
- **Performance review:** read `state/crypto_paper.json` `closed` list and the latest `summary`
  in the log. Report: equity vs `paper_start_cash`, trade count, win rate, sum of `pnl`,
  largest loss, current open positions with their stops.
- **Change coins:** edit `symbols`. Keep liquid pairs quoted in `quote` on the chosen exchange.
- **Change exchange:** `exchange` is a ccxt id. Default `kraken` (works from US GitHub runners).
  Binance and Bybit block US IPs, so GitHub-hosted runners can't reach them.

## How it trades

Trend-pullback on 4h candles, long only (spot): in an uptrend (close and EMA50 above EMA200),
buy when RSI recovers above 50 after dipping below 40. Stop 2×ATR, target 4×ATR, stop trails at
3×ATR, exit if price closes below EMA200. Each trade risks 1% of equity, capped at 25% of
equity per position, 60% total exposure, 3 positions. New entries stop for the day after a 3%
drawdown. Stops are checked hourly against the last price, not held on the exchange. A fast
crash between runs can fill worse than the stop.
