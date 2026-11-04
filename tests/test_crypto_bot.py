import unittest

from tests.test_strategy import synthetic
from trading import crypto_bot, strategy

H = 3_600_000


def cfg(**over):
    c = {"trading_enabled": True, "mode": "paper", "symbols": ["BTC/USD"], "timeframe": "4h",
         "strategy": {}, "risk": {"max_open_positions": 3, "max_daily_loss_pct": 3.0,
                                  "max_total_exposure_pct": 60.0}}
    c.update(over)
    return c


class FakeMarket:
    def __init__(self, candles, price=None):
        self.candles, self._price = candles, price

    def ohlcv(self, symbol, timeframe):
        return self.candles

    def price(self, symbol):
        return self._price if self._price is not None else self.candles[-2][4]


def entry_index():
    c = synthetic()
    ind = strategy.indicators(c, strategy.DEFAULTS)
    return c, next(i for i in range(len(c)) if strategy.entry_signal(ind, i, strategy.DEFAULTS))


class CryptoBotTest(unittest.TestCase):
    def setUp(self):
        crypto_bot.log = lambda e: None
        self.state = {"cash": 10_000.0, "positions": {}}
        self.broker = crypto_bot.PaperBroker(self.state, fee_pct=0.1, slippage_pct=0.0)

    def market_at_signal(self):
        c, i = entry_index()
        # candles[:-1] are closed; make the signal candle the last closed one
        return FakeMarket(c[: i + 2]), c, i

    def test_enters_on_signal_with_risk_sizing(self):
        m, c, i = self.market_at_signal()
        crypto_bot.run(cfg(), m, self.broker, self.state)
        pos = self.state["positions"]["BTC/USD"]
        self.assertLess(pos["stop"], pos["entry"])
        self.assertLess(pos["entry"], pos["target"])
        self.assertLessEqual(pos["units"] * pos["entry"], 10_000 * 0.25 + 1)
        self.assertLess(self.state["cash"], 10_000)

    def test_same_candle_not_traded_twice(self):
        m, _, _ = self.market_at_signal()
        crypto_bot.run(cfg(), m, self.broker, self.state)
        units = self.state["positions"]["BTC/USD"]["units"]
        cash = self.state["cash"]
        crypto_bot.run(cfg(), m, self.broker, self.state)
        self.assertEqual(self.state["positions"]["BTC/USD"]["units"], units)
        self.assertEqual(self.state["cash"], cash)

    def test_stop_exit_on_price(self):
        m, _, _ = self.market_at_signal()
        crypto_bot.run(cfg(), m, self.broker, self.state)
        stop = self.state["positions"]["BTC/USD"]["stop"]
        m._price = stop - 1
        crypto_bot.run(cfg(), m, self.broker, self.state)
        self.assertEqual(self.state["positions"], {})
        self.assertEqual(self.state["closed"][0]["reason"], "stop")
        self.assertLess(self.state["closed"][0]["pnl"], 0)

    def test_kill_switch(self):
        m, _, _ = self.market_at_signal()
        crypto_bot.run(cfg(trading_enabled=False), m, self.broker, self.state)
        self.assertEqual(self.state["positions"], {})
        self.assertEqual(self.state["cash"], 10_000.0)

    def test_dry_run_changes_nothing(self):
        m, _, _ = self.market_at_signal()
        crypto_bot.run(cfg(), m, self.broker, self.state, dry_run=True)
        self.assertEqual(self.state["positions"], {})
        self.assertEqual(self.state["cash"], 10_000.0)

    def test_daily_loss_halts_entries(self):
        m, _, _ = self.market_at_signal()
        self.state.update({"day": crypto_bot.now().date().isoformat(), "day_start_equity": 11_000.0})
        crypto_bot.run(cfg(), m, self.broker, self.state)
        self.assertEqual(self.state["positions"], {})

    def test_max_open_positions(self):
        m, _, _ = self.market_at_signal()
        self.state["positions"]["ETH/USD"] = {"units": 0.0, "entry": 1, "stop": 0, "target": 9e9,
                                              "opened": "x"}
        crypto_bot.run(cfg(risk={"max_open_positions": 1, "max_daily_loss_pct": 3.0,
                                 "max_total_exposure_pct": 60.0}), m, self.broker, self.state)
        self.assertNotIn("BTC/USD", self.state["positions"])


if __name__ == "__main__":
    unittest.main()
