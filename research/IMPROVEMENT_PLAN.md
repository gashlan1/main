# How to make these bots better

Written 2026-11-05 after the first backtests on real data. Numbers come from
`research/backtests/2026-11-05/` (report.md, daily_trend.md), produced by the `backtest`
GitHub Action with the repo's own strategy code.

## 1. What the data says about the current strategy

The crypto bot and the gold EA share one strategy: trend-pullback on 4h (crypto) and 1h
(gold) candles, with ATR stops and targets. On 2021–2026 crypto history and 2022–2026 gold
history it **loses money everywhere**, including the out-of-sample period it never saw:

| Market | Full period | In-sample (first 70%) | Out-of-sample (last 30%) | Buy & hold, full |
|---|---|---|---|---|
| BTC | −2.96 % (71 trades) | +0.23 % | −3.18 % | +166.6 % (max DD 77 %) |
| ETH | −4.72 % (63) | +0.95 % | −5.62 % | +204.4 % (max DD 81 %) |
| SOL | −10.97 % (79) | −5.16 % | −6.13 % | +6193 % (max DD 97 %) |
| XAUUSD | −6.76 % (164) | −2.01 % | −4.85 % | +111.8 % (max DD 30 %) |

Details that matter:

- **Win rate 26–37 %, profit factor below 1 out of sample on all four markets.** About two
  thirds of exits are stop-outs. The small size of the losses (each trade risks 1 % or 0.5 %
  of equity) hides how weak the signal is.
- **Fees eat it.** In-sample profit factors of 1.0–1.2 are before the entry fee; after both fees
  the edge is zero or negative. Crypto round trips cost ~0.6 % at Kraken taker rates.
- **No setting rescues it.** A 27-cell grid (stop, target, RSI dip) was searched in-sample with
  a pre-registered "pick the robust cell" rule. The picks did no better out of sample
  (BTC −3.7 %, ETH −9.0 %, SOL −6.1 %, gold −1.9 %). ETH has pockets of +10 % in-sample
  that vanish out of sample: the signature of noise, not edge.
- **The one good thing:** drawdowns were small (4–17 %) while buy-and-hold crypto fell 53–75 %
  in the 2025–26 out-of-sample period. The risk controls work; the signal does not.

Why it fails: intraday candles are mostly noise, so tight ATR stops get hit constantly; the
fixed 4×ATR target cuts off the rare big winners that trend strategies live on; and the
EMA50/EMA200 filter lags, so the bot buys late in trends and is still long when they end.

**Conclusion: do not tune this strategy further. Replace it.**

## 2. A better strategy: daily trend following

Classic, widely published, and simple enough to audit: on **daily** closes, be long while the
close is above its 200-day moving average, otherwise hold cash (variant: also require the
close to be above its level 90 days ago). Rules were fixed before the test was run.

Results on the same data and the same split (`daily_trend.md`; 100 % long or cash, one fee
per side, no leverage):

| Market | Window | SMA200 rule: return / max DD | SMA200 + momentum: return / max DD | Buy & hold: return / max DD | Pullback bot: return / max DD |
|---|---|---|---|---|---|
| BTC | full 2021–26 | +100.9 % / 36.8 % (25 trips) | +127.1 % / 38.8 % | +166.6 % / 76.6 % | −3.0 % / 8.8 % |
| BTC | out-of-sample | −18.7 % / 30.8 % | +1.3 % / 13.2 % | −26.4 % / 53.0 % | −3.2 % / 3.6 % |
| ETH | full | +196.7 % / 39.5 % (15 trips) | +114.2 % / 36.0 % | +204.4 % / 79.3 % | −4.7 % / 11.8 % |
| ETH | out-of-sample | −4.6 % / 39.5 % | +16.6 % / 26.1 % | −31.0 % / 67.6 % | −5.6 % / 8.8 % |
| SOL | full | +1393 % / 67.2 % (22 trips) | +413 % / 74.6 % | +6193 % / 96.3 % | −11.0 % / 16.7 % |
| SOL | out-of-sample | −24.2 % / 33.1 % | −26.3 % / 35.5 % | −60.2 % / 74.9 % | −6.1 % / 8.3 % |
| XAUUSD | full 2022–26 | +119.6 % / 22.6 % (11 trips) | +132.4 % / 20.1 % | +111.8 % / 29.7 % | −6.8 % / 7.9 % |
| XAUUSD | out-of-sample | +28.8 % / 22.6 % | +32.4 % / 20.1 % | +17.7 % / 29.7 % | −4.9 % / 7.4 % |

Reading it honestly:

- **Gold:** the daily rule beat buy-and-hold on return *and* drawdown, in-sample and out of
  sample, with 8–11 trades in five years. This is the strongest result in the whole study.
- **Crypto, full period:** 60–100 % of buy-and-hold's return with roughly half the drawdown
  (BTC 37 % vs 77 %, ETH 40 % vs 79 %). SOL's 67 % drawdown shows a single coin at 100 %
  allocation is still far too much risk.
- **Crypto, out of sample (Feb 2025 – Oct 2026, a falling, choppy market):** the plain SMA200
  rule lost money on all three coins (−5 % to −24 %), though far less than holding
  (−26 % to −60 %). Adding the momentum condition turned BTC and ETH positive (+1 %, +17 %)
  but not SOL. These windows contain only 4–10 trades each, so treat them as "survived a bad
  period", not as proof.
- **Against the pullback bot:** every daily-rule cell beats the current strategy on return, at
  the cost of larger drawdowns because it is fully invested while long. Scaling position size
  by volatility, plus the bot's existing caps (25 % per coin, 60 % total), would bring the
  drawdowns down; that is the next backtest to run.

What this changes mechanically:

- A handful of trades per year instead of dozens, so fees stop mattering.
- No fixed profit target: winners run until the trend ends.
- Decisions once a day, so GitHub's unreliable scheduler is no longer a problem (a run that
  starts three hours late still trades the same daily signal).

Honest expectations: in a strong bull market buy-and-hold beats any trend filter on raw
return. The filter earns its keep by sitting out the long declines, which is where the
drawdown numbers come from. The goal is "most of the upside with a fraction of the
drawdown", not "beat the market every year". Position size should scale with volatility
(smaller when the market is wild) so that a 1x spot allocation never becomes a 90 % drawdown.

## 3. Execution and infrastructure

| Problem today | Fix |
|---|---|
| GitHub ran the hourly crypto job once in 8 hours; the stock job started hours late | Daily strategy (above) makes one run a day enough. For anything that needs minute-level reliability, use a small always-on server, not Actions. GitHub's terms forbid using Actions as general always-on compute ([terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)). |
| Stops live only in the bot's state file; a crash between runs fills far below the stop | Place stop-loss orders on the exchange (Kraken supports stop-loss and stop-loss-limit orders) when going live. [Freqtrade](https://www.freqtrade.io/en/latest/exchanges) does this out of the box (`stoploss_on_exchange`). |
| Hand-written bot loop, order handling and paper simulation | Before any live money, run the strategy inside Freqtrade: mature open-source engine, dry-run mode, exchange-side stops, backtesting and parameter search, Telegram control. Our strategy ports to a ~60-line Freqtrade strategy class. It needs an always-on host (a $5–10/month VPS is enough and can also host MT5 for gold). |
| Gold EA duplicates the strategy in MQL5; cannot be compiled or tested from this environment | Port the daily rule to the EA (a D1 close vs SMA200 check is much simpler than the current code), test it in the MT5 Strategy Tester on 2+ years. Alternative that avoids Windows entirely: trade XAU/USD through OANDA's REST API from the same Python bot (free practice accounts, stop-loss on the order). |
| Alpaca stock bot has no keys and a different (SMA 20/50) strategy that was never tested | Either add paper keys and run the same daily trend study on SPY/QQQ, or retire it to keep the project focused. |

## 4. Research process from now on

1. Every strategy change is tested with the `backtest` Action on real data before it touches
   a bot. Positive **out of sample**, not just overall, or it does not ship.
2. Walk-forward testing (rolling train/test windows) instead of a single split, once a
   candidate survives step 1.
3. A portfolio-level backtest (several assets at once, the bot's real caps) before live.
4. Paper trade for at least three months and compare the paper log with the backtest; if they
   disagree, find out why before live.
5. Never present backtest or paper results as a forecast. Live results are worse than both.

## 5. Decisions needed

1. Switch the paper crypto bot to the daily trend rule? (Recommended if the study in §2
   confirms it on this data.)
2. Gold: port the daily rule into the MT5 EA, or move gold to OANDA so one Python bot runs
   both markets?
3. Hosting: stay on GitHub Actions for paper trading (free, adequate for daily decisions), and
   only rent a VPS + run Freqtrade before live money. Or rent the VPS now.
4. Keep or retire the Alpaca stock bot.
