import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "bot"))
import trader  # noqa: E402

RISK = {"max_trade_usd": 1000, "max_total_exposure_usd": 4000, "max_daily_loss_pct": 2.0}


class FakeBroker:
    def __init__(self, closes, positions=None, equity=10000, last_equity=10000, is_open=True):
        self._closes, self._positions = closes, positions or {}
        self.equity, self.last_equity, self.is_open = equity, last_equity, is_open
        self.orders = []

    def clock(self):
        return {"is_open": self.is_open}

    def account(self):
        return {"equity": self.equity, "last_equity": self.last_equity, "buying_power": 10000}

    def positions(self):
        return self._positions

    def closes(self, symbol):
        return self._closes[symbol]

    def buy_notional(self, symbol, usd):
        self.orders.append(("buy", symbol, usd))

    def close_position(self, symbol):
        self.orders.append(("sell", symbol))


UP = list(range(1, 61))
DOWN = list(range(60, 0, -1))


def cfg(**over):
    c = {"trading_enabled": True, "mode": "paper", "watchlist": ["A", "B"],
         "strategy": {"fast_sma": 5, "slow_sma": 20}, "risk": dict(RISK)}
    c.update(over)
    return c


class TraderTest(unittest.TestCase):
    def setUp(self):
        trader.log = lambda e: None

    def test_signal(self):
        self.assertEqual(trader.signal(UP, 5, 20), "buy")
        self.assertEqual(trader.signal(DOWN, 5, 20), "sell")
        self.assertIsNone(trader.signal(UP[:10], 5, 20))

    def test_buy_amount_respects_limits(self):
        self.assertEqual(trader.buy_amount(RISK, 0, 10000), 1000)
        self.assertEqual(trader.buy_amount(RISK, 3500, 10000), 500)
        self.assertEqual(trader.buy_amount(RISK, 4000, 10000), 0)
        self.assertEqual(trader.buy_amount(RISK, 0, 200), 200)

    def test_buys_uptrend_sells_downtrend(self):
        b = FakeBroker({"A": UP, "B": DOWN}, positions={"B": {"market_value": "500"}})
        trader.run(cfg(), b)
        self.assertEqual(b.orders, [("buy", "A", 1000), ("sell", "B")])

    def test_kill_switch(self):
        b = FakeBroker({"A": UP, "B": UP})
        trader.run(cfg(trading_enabled=False), b)
        self.assertEqual(b.orders, [])

    def test_daily_loss_halts_buys_but_allows_sells(self):
        b = FakeBroker({"A": UP, "B": DOWN}, positions={"B": {"market_value": "500"}},
                       equity=9700, last_equity=10000)
        trader.run(cfg(), b)
        self.assertEqual(b.orders, [("sell", "B")])

    def test_market_closed(self):
        b = FakeBroker({"A": UP, "B": UP}, is_open=False)
        trader.run(cfg(), b)
        self.assertEqual(b.orders, [])

    def test_dry_run_sends_nothing(self):
        b = FakeBroker({"A": UP, "B": UP})
        trader.run(cfg(), b, dry_run=True)
        self.assertEqual(b.orders, [])


if __name__ == "__main__":
    unittest.main()
