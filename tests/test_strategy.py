import math
import unittest

from trading import backtest, strategy

P = dict(strategy.DEFAULTS)


def synthetic(n=900, drift=0.15, wave=6.0, period=40, start=100.0):
    """Uptrend with regular pullbacks: [ts, o, h, l, c, v] candles."""
    out, prev = [], start
    for i in range(n):
        close = start + drift * i + wave * math.sin(2 * math.pi * i / period)
        high, low = max(prev, close) + 0.5, min(prev, close) - 0.5
        out.append([i * 3_600_000, prev, high, low, close, 1.0])
        prev = close
    return out


class IndicatorTest(unittest.TestCase):
    def test_ema_constant_series(self):
        self.assertEqual(strategy.ema([5.0] * 10, 3)[-1], 5.0)
        self.assertEqual(strategy.ema([1, 2, 3], 3)[-1], 2.0)
        self.assertEqual(strategy.ema([1, 2], 3), [])

    def test_rsi_bounds(self):
        up = strategy.rsi(list(range(1, 40)), 14)
        down = strategy.rsi(list(range(40, 1, -1)), 14)
        self.assertEqual(up[-1], 100.0)
        self.assertAlmostEqual(down[-1], 0.0)

    def test_atr_constant_range(self):
        n = 30
        highs, lows, closes = [11.0] * n, [9.0] * n, [10.0] * n
        self.assertAlmostEqual(strategy.atr(highs, lows, closes, 14)[-1], 2.0)

    def test_position_size_risk_and_cap(self):
        # 1% of 10k = $100 risk; $2 stop distance -> 50 units ($5k) capped at 25% = $2.5k -> 25 units
        self.assertAlmostEqual(strategy.position_size(10_000, 100, 98, P), 25.0)
        wide = strategy.position_size(10_000, 100, 80, P)  # $20 stop -> 5 units
        self.assertAlmostEqual(wide, 5.0)
        self.assertEqual(strategy.position_size(10_000, 100, 101, P), 0.0)


class SignalTest(unittest.TestCase):
    def test_uptrend_with_pullbacks_triggers_entries(self):
        c = synthetic()
        ind = strategy.indicators(c, P)
        hits = [i for i in range(len(c)) if strategy.entry_signal(ind, i, P)]
        self.assertGreater(len(hits), 3)
        self.assertTrue(all(i >= strategy.warmup(P) - 1 for i in hits))

    def test_downtrend_never_enters(self):
        c = synthetic(drift=-0.15, start=300)
        ind = strategy.indicators(c, P)
        self.assertFalse(any(strategy.entry_signal(ind, i, P) for i in range(len(c))))

    def test_manage_stop_takes_priority(self):
        pos = {"entry": 100, "stop": 95, "target": 110}
        c = [0, 100, 111, 94, 100, 0]  # touches both
        ind = {"slow": [None], "atr": [None]}
        self.assertEqual(strategy.manage(pos, c, ind, 0, P), ("exit", 95, "stop"))

    def test_manage_trails_stop_up_only(self):
        pos = {"entry": 100, "stop": 95, "target": 200}
        ind = {"slow": [90], "atr": [2.0]}
        _, stop, _ = strategy.manage(pos, [0, 100, 110, 105, 108, 0], ind, 0, P)
        self.assertEqual(stop, 108 - P["trail_atr"] * 2.0)
        _, stop2, _ = strategy.manage({**pos, "stop": 104}, [0, 100, 101, 99.5, 100, 0], ind, 0, P)
        self.assertEqual(stop2, 104)


class BacktestTest(unittest.TestCase):
    def test_backtest_runs_and_reports(self):
        r = backtest.run_backtest(synthetic(), fee_pct=0.1)
        self.assertGreater(r["trades"], 0)
        self.assertGreater(r["return_pct"], 0)
        for key in ("max_drawdown_pct", "win_rate_pct", "profit_factor", "final_equity"):
            self.assertIn(key, r)

    def test_backtest_flat_in_downtrend(self):
        r = backtest.run_backtest(synthetic(drift=-0.15, start=300))
        self.assertEqual(r["trades"], 0)
        self.assertEqual(r["return_pct"], 0.0)

    def test_load_mt5_csv(self):
        import os
        import tempfile
        rows = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\n" \
               "2026.01.02\t01:00:00\t2650.1\t2655.0\t2648.2\t2653.3\t1200\n" \
               "2026.01.02\t02:00:00\t2653.3\t2660.4\t2651.0\t2659.9\t1300\n"
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
            f.write(rows)
        try:
            c = backtest.load_csv(f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual(len(c), 2)
        self.assertEqual(c[1][1:5], [2653.3, 2660.4, 2651.0, 2659.9])


if __name__ == "__main__":
    unittest.main()
