"""Trend-pullback strategy shared by the crypto bot, the backtester and (as a
reference port) the MT5 gold EA.

Long only. Rules, evaluated on each closed candle:
  Trend   close > slow EMA and fast EMA > slow EMA
  Entry   RSI dips below `rsi_dip` within the last `dip_lookback` candles,
          then closes back above `rsi_entry` (pullback recovers in trend)
  Stop    entry - stop_atr * ATR, trailed up to close - trail_atr * ATR
  Target  entry + target_atr * ATR
  Exit    stop or target hit, or close drops below slow EMA
  Size    risk_pct of equity lost if the stop is hit, capped at
          max_position_pct of equity
"""

DEFAULTS = {
    "fast_ema": 50,
    "slow_ema": 200,
    "rsi_period": 14,
    "rsi_dip": 40,
    "rsi_entry": 50,
    "dip_lookback": 6,
    "atr_period": 14,
    "stop_atr": 2.0,
    "target_atr": 4.0,
    "trail_atr": 3.0,
    "risk_pct": 1.0,
    "max_position_pct": 25.0,
}


def ema(values, n):
    if len(values) < n:
        return []
    k = 2 / (n + 1)
    out = [sum(values[:n]) / n]
    for v in values[n:]:
        out.append(v * k + out[-1] * (1 - k))
    return [None] * (n - 1) + out


def rsi(closes, n):
    if len(closes) <= n:
        return []
    gains = [max(closes[i] - closes[i - 1], 0) for i in range(1, len(closes))]
    losses = [max(closes[i - 1] - closes[i], 0) for i in range(1, len(closes))]
    avg_g, avg_l = sum(gains[:n]) / n, sum(losses[:n]) / n
    out = [None] * n

    def value(g, l):
        return 100.0 if l == 0 else 100 - 100 / (1 + g / l)

    out.append(value(avg_g, avg_l))
    for g, l in zip(gains[n:], losses[n:]):
        avg_g = (avg_g * (n - 1) + g) / n
        avg_l = (avg_l * (n - 1) + l) / n
        out.append(value(avg_g, avg_l))
    return out


def atr(highs, lows, closes, n):
    if len(closes) <= n:
        return []
    trs = [highs[0] - lows[0]] + [
        max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
        for i in range(1, len(closes))
    ]
    out = [None] * (n - 1) + [sum(trs[:n]) / n]
    for tr in trs[n:]:
        out.append((out[-1] * (n - 1) + tr) / n)
    return out


def indicators(candles, p):
    """candles: list of [ts, open, high, low, close, volume], oldest first."""
    highs = [c[2] for c in candles]
    lows = [c[3] for c in candles]
    closes = [c[4] for c in candles]
    return {
        "close": closes,
        "fast": ema(closes, p["fast_ema"]),
        "slow": ema(closes, p["slow_ema"]),
        "rsi": rsi(closes, p["rsi_period"]),
        "atr": atr(highs, lows, closes, p["atr_period"]),
    }


def warmup(p):
    return max(p["slow_ema"], p["rsi_period"] + p["dip_lookback"], p["atr_period"]) + 1


def entry_signal(ind, i, p):
    """True if candle i (closed) is a long entry."""
    if i < warmup(p) - 1:
        return False
    close, fast, slow, r = ind["close"][i], ind["fast"][i], ind["slow"][i], ind["rsi"]
    if None in (fast, slow, r[i], r[i - 1], ind["atr"][i]):
        return False
    if not (close > slow and fast > slow):
        return False
    recent = [x for x in r[i - p["dip_lookback"]:i] if x is not None]
    dipped = recent and min(recent) < p["rsi_dip"]
    return bool(dipped and r[i - 1] <= p["rsi_entry"] < r[i])


def position_size(equity, price, stop, p):
    """Units to buy so a stop-out loses risk_pct of equity."""
    risk_per_unit = price - stop
    if risk_per_unit <= 0 or equity <= 0:
        return 0.0
    units = equity * p["risk_pct"] / 100 / risk_per_unit
    max_units = equity * p["max_position_pct"] / 100 / price
    return max(0.0, min(units, max_units))


def open_levels(price, atr_value, p):
    return {"stop": price - p["stop_atr"] * atr_value, "target": price + p["target_atr"] * atr_value}


def manage(position, candle, ind, i, p):
    """Return ("exit", price, reason) or ("hold", new_stop, None) for an open long.

    candle is the bar just closed; stop/target are checked against its range
    (stop first, the conservative assumption when both are touched).
    """
    high, low, close = candle[2], candle[3], candle[4]
    if low <= position["stop"]:
        return "exit", position["stop"], "stop"
    if high >= position["target"]:
        return "exit", position["target"], "target"
    slow = ind["slow"][i]
    if slow is not None and close < slow:
        return "exit", close, "trend_break"
    new_stop = position["stop"]
    if ind["atr"][i] is not None:
        new_stop = max(new_stop, close - p["trail_atr"] * ind["atr"][i])
    return "hold", new_stop, None
