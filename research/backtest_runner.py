#!/usr/bin/env python3
"""Backtest the crypto bot (BTC/ETH/SOL, 4h) and the XAUUSD gold EA (H1) on real
historical data with the repository's own trading/strategy.py and
trading/backtest.py, unmodified. Only `params` are varied.

Layout under BASE (default ./bt; override with --base or BT_BASE):
  trading/{__init__,strategy,backtest}.py  verbatim copies of the repo files
                                           (or point --code-dir at the repo root)
  raw/                                     downloaded archives (cache, data only)
  data/<SYMBOL>_<TF>.csv                   parsed candles: ts_ms,open,high,low,close,volume
  results/*.json                           one file per step

Steps, in order. Each step reads only files written by earlier steps, so a
recycled sandbox resumes at any step without losing work:
  fetch-crypto  Binance spot 4h klines (data.binance.vision monthly archives)
  fetch-gold    Dukascopy XAUUSD hourly BID candles (.bi5, one file per month)
  describe      date ranges, bar counts, gaps, price sanity checks
  baseline      live settings on full / in-sample (first 70%) / out-of-sample (last 30%)
  benchmark     buy-and-hold over the same windows
  grid          stop_atr x target_atr x rsi_dip on in-sample only, then a robust pick
  oos           the robust pick, run once on out-of-sample, vs the baseline
  summary       markdown tables from the saved results

Example (e.g. GitHub Actions, from the repo root):
  pip install requests
  python research/backtest_runner.py --code-dir . --base ./bt all
"""

import argparse
import csv
import hashlib
import io
import json
import lzma
import math
import os
import random
import struct
import sys
import threading
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE = Path(os.environ.get("BT_BASE", "bt"))
CODE_DIR = BASE

CRYPTO_SYMBOLS = {"BTC": "BTCUSDT", "ETH": "ETHUSDT", "SOL": "SOLUSDT"}
CRYPTO_RANGE = ((2021, 1), (2026, 10))
GOLD_SYMBOL = "XAUUSD"
GOLD_RANGE = ((2022, 1), (2026, 10))
GOLD_PLAUSIBLE = (1600.0, 5000.0)  # sanity range for the price scale check

# Live settings. Crypto: strategy.DEFAULTS + config/crypto.json "strategy" block.
CRYPTO_LIVE = {"risk_pct": 1.0, "max_position_pct": 25.0}
# Gold EA inputs mapped onto strategy params (max_position_pct 3000: leveraged CFD,
# the EA caps margin, not notional).
GOLD_EA = {"stop_atr": 1.5, "target_atr": 3.0, "trail_atr": 2.0, "risk_pct": 0.5, "max_position_pct": 3000}
MARKETS = {
    "BTC": {"csv": "BTCUSDT_4h.csv", "params": CRYPTO_LIVE, "fee_pct": 0.31, "step_ms": 4 * 3600_000},
    "ETH": {"csv": "ETHUSDT_4h.csv", "params": CRYPTO_LIVE, "fee_pct": 0.31, "step_ms": 4 * 3600_000},
    "SOL": {"csv": "SOLUSDT_4h.csv", "params": CRYPTO_LIVE, "fee_pct": 0.31, "step_ms": 4 * 3600_000},
    "XAUUSD": {"csv": "XAUUSD_H1.csv", "params": GOLD_EA, "fee_pct": 0.02, "step_ms": 3600_000},
}
GRID = {"stop_atr": [1.5, 2.0, 2.5], "target_atr": [3.0, 4.0, 6.0], "rsi_dip": [35, 40, 45]}
AXES = ("stop_atr", "target_atr", "rsi_dip")
IS_FRACTION = 0.70
MIN_TRADES = 30
EQUITY = 10_000.0


# ----------------------------------------------------------------------------- setup / io

def setup(base=None, code_dir=None):
    """Point the runner at BASE and make the `trading` package importable."""
    global BASE, CODE_DIR
    if base:
        BASE = Path(base)
    CODE_DIR = Path(code_dir) if code_dir else BASE
    for d in ("data", "results", "raw"):
        (BASE / d).mkdir(parents=True, exist_ok=True)
    if str(CODE_DIR) not in sys.path:
        sys.path.insert(0, str(CODE_DIR))


def bt_modules():
    from trading import backtest, strategy
    return strategy, backtest


def code_provenance():
    strategy, backtest = bt_modules()
    return {Path(m.__file__).name: hashlib.sha256(Path(m.__file__).read_bytes()).hexdigest()
            for m in (strategy, backtest)}


def utc(ts_ms):
    return datetime.fromtimestamp(ts_ms / 1000, timezone.utc).strftime("%Y-%m-%d %H:%M")


def jsonable(d):
    return {k: ("inf" if isinstance(v, float) and math.isinf(v) else v) for k, v in d.items()}


def save_json(name, obj):
    path = BASE / "results" / name
    tmp = path.with_name(path.name + ".part")
    tmp.write_text(json.dumps(obj, indent=1, default=str, allow_nan=False))
    os.replace(tmp, path)
    return str(path)


def load_json(name):
    path = BASE / "results" / name
    return json.loads(path.read_text()) if path.exists() else None


def write_candles(path, rows):
    tmp = path.with_name(path.name + ".part")
    with open(tmp, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ts_ms", "open", "high", "low", "close", "volume"])
        for r in rows:
            w.writerow([int(r[0])] + [repr(float(x)) for x in r[1:6]])
    os.replace(tmp, path)


def load_candles(path):
    with open(path, newline="") as f:
        rd = csv.reader(f)
        next(rd)
        return [[int(r[0])] + [float(x) for x in r[1:6]] for r in rd]


def dedupe_sort(rows):
    by_ts = {}
    for r in rows:
        by_ts[int(r[0])] = r
    return [by_ts[t] for t in sorted(by_ts)], len(rows) - len(by_ts)


def months(start, end):
    (y, m), out = start, []
    while (y, m) <= end:
        out.append((y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


# ----------------------------------------------------------------------------- http

_TLS = threading.local()


def session():
    """One requests.Session per thread."""
    s = getattr(_TLS, "session", None)
    if s is None:
        s = _TLS.session = requests.Session()
    return s


def http_get(url, tries=6, timeout=40, wait=2.0):
    """GET with exponential backoff on errors, 429 and 5xx. Bytes, or None on 404."""
    last = None
    for k in range(tries):
        try:
            r = session().get(url, timeout=timeout)
            if r.status_code == 200:
                return r.content
            if r.status_code == 404:
                return None
            last = f"HTTP {r.status_code}"
        except requests.RequestException as e:
            last = type(e).__name__
        if k < tries - 1:
            time.sleep(wait * 2 ** k * random.uniform(0.75, 1.25))
    raise RuntimeError(f"GET {url} failed after {tries} tries: {last}")


def cache_put(path, blob):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".part")
    tmp.write_bytes(blob)
    os.replace(tmp, path)


def cached_get(url, path, check=None, **kw):
    """Download once into `path`; `check(blob)` validates (and must not raise)."""
    if path.exists() and path.stat().st_size:
        blob = path.read_bytes()
        try:
            if check:
                check(blob)
            return blob
        except Exception:
            path.unlink()
    blob = http_get(url, **kw)
    if blob:
        if check:
            check(blob)
        cache_put(path, blob)
    return blob


# ----------------------------------------------------------------------------- crypto: Binance

def binance_rows(blob):
    """[ts_ms, o, h, l, c, v] rows from a Binance kline zip (CSV without header)."""
    rows = []
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        for name in z.namelist():
            for line in z.read(name).decode().splitlines():
                f = line.split(",")
                if len(f) < 6 or not f[0].strip().isdigit():
                    continue  # header or blank line
                ts = int(f[0])
                if ts > 1e14:  # archives from 2025 on use microseconds
                    ts //= 1000
                rows.append([ts] + [float(x) for x in f[1:6]])
    return rows


def binance_month(symbol, y, m, tf="4h"):
    root = "https://data.binance.vision/data/spot"
    name = f"{symbol}-{tf}-{y}-{m:02d}"
    blob = cached_get(f"{root}/monthly/klines/{symbol}/{tf}/{name}.zip",
                      BASE / "raw" / "binance" / symbol / f"{name}.zip", check=binance_rows)
    if blob:
        return binance_rows(blob), "monthly"
    rows = []  # monthly archive not published yet: fall back to the daily archives
    ndays = (datetime(y + m // 12, m % 12 + 1, 1) - datetime(y, m, 1)).days
    for d in range(1, ndays + 1):
        blob = cached_get(f"{root}/daily/klines/{symbol}/{tf}/{name}-{d:02d}.zip",
                          BASE / "raw" / "binance" / symbol / f"{name}-{d:02d}.zip", check=binance_rows)
        if blob:
            rows += binance_rows(blob)
    return rows, "daily"


def fetch_crypto(workers=6):
    log = load_json("fetch_crypto.json") or {}
    mlist = months(*CRYPTO_RANGE)
    for name, sym in CRYPTO_SYMBOLS.items():
        out = BASE / "data" / MARKETS[name]["csv"]
        if out.exists() and name in log:
            continue  # done before a reset
        with ThreadPoolExecutor(workers) as ex:
            parts = list(ex.map(lambda ym: binance_month(sym, *ym), mlist))
        rows, dups = dedupe_sort([r for part, _ in parts for r in part])
        write_candles(out, rows)
        log[name] = {
            "source": "Binance spot klines, https://data.binance.vision (monthly zip archives)",
            "symbol": sym, "interval": "4h",
            "months_requested": f"{mlist[0][0]}-{mlist[0][1]:02d} .. {mlist[-1][0]}-{mlist[-1][1]:02d}",
            "months_via_daily_files": [f"{y}-{m:02d}" for (y, m), (_, how) in zip(mlist, parts) if how == "daily"],
            "empty_months": [f"{y}-{m:02d}" for (y, m), (p, _) in zip(mlist, parts) if not p],
            "rows_downloaded": sum(len(p) for p, _ in parts), "duplicates_dropped": dups, "rows": len(rows),
        }
        save_json("fetch_crypto.json", log)
    return log


# ----------------------------------------------------------------------------- gold: Dukascopy

DUKA_URL = "https://datafeed.dukascopy.com/datafeed/{sym}/{y}/{m0:02d}/BID_candles_hour_1.bi5"


def bi5_records(blob):
    """Decode a Dukascopy candle .bi5: LZMA-compressed 24-byte big-endian records
    (int32 seconds from period start, int32 open, close, low, high, float32 volume)."""
    raw = lzma.decompress(blob)
    if len(raw) % 24:
        raise ValueError(f"{len(raw)} bytes is not a whole number of 24-byte records")
    return [struct.unpack_from(">5if", raw, off) for off in range(0, len(raw), 24)]


def gold_raw_path(y, m):
    return BASE / "raw" / "dukascopy" / GOLD_SYMBOL / f"{y}-{m - 1:02d}.bi5"  # 0-based month like the URL


def fetch_gold_raw(pause=None, backoff=90.0, max_backoff=900.0, deadline=None):
    """Sequential, paced download: the datafeed answers 429 to bursts, so wait
    DUKA_PAUSE seconds (default 5) between months and back off on errors. Resumable via the raw cache.
    Progress is logged to raw/dukascopy/progress.json."""
    if pause is None:
        pause = float(os.environ.get("DUKA_PAUSE", 5.0))
    prog_path = BASE / "raw" / "dukascopy" / "progress.json"
    prog_path.parent.mkdir(parents=True, exist_ok=True)
    prog = json.loads(prog_path.read_text()) if prog_path.exists() else {"attempts": []}
    t0, wait = time.time(), backoff
    for y, m in months(*GOLD_RANGE):
        path = gold_raw_path(y, m)
        if path.exists() and path.stat().st_size:
            continue
        while True:
            if deadline and time.time() - t0 > deadline:
                return prog
            try:
                r = session().get(DUKA_URL.format(sym=GOLD_SYMBOL, y=y, m0=m - 1), timeout=40)
                code, blob = r.status_code, r.content
            except requests.RequestException as e:
                code, blob = type(e).__name__, b""
            ok = code == 200 and len(blob) > 0
            if ok:
                try:
                    bi5_records(blob)
                except Exception as e:  # corrupt body: treat as a failure and retry
                    ok, code = False, f"bad bi5: {e}"
            prog["attempts"].append([datetime.now(timezone.utc).strftime("%H:%M:%S"), f"{y}-{m:02d}", code, len(blob)])
            prog_path.write_text(json.dumps(prog))
            if ok:
                cache_put(path, blob)
                wait = backoff
                time.sleep(pause)
                break
            if code == 404:
                prog.setdefault("missing", []).append(f"{y}-{m:02d}")
                prog_path.write_text(json.dumps(prog))
                break
            time.sleep(wait * random.uniform(0.9, 1.1))
            wait = min(wait * 1.5, max_backoff)
    prog["done"] = True
    prog_path.write_text(json.dumps(prog))
    return prog


def gold_status():
    have = [f"{y}-{m:02d}" for y, m in months(*GOLD_RANGE) if gold_raw_path(y, m).exists()]
    prog_path = BASE / "raw" / "dukascopy" / "progress.json"
    prog = json.loads(prog_path.read_text()) if prog_path.exists() else {"attempts": []}
    return {"have": len(have), "need": len(months(*GOLD_RANGE)), "last_attempts": prog["attempts"][-8:],
            "attempts_total": len(prog["attempts"]), "missing": prog.get("missing", [])}


# ----------------------------------------------------------------------------- background jobs
# Notebook calls time out long before the work is done, so long steps run in
# daemon threads; results and errors are kept here (survives importlib.reload).

_JOBS = globals().get("_JOBS", {})


def start_job(name, fn, *args, **kw):
    job = _JOBS.get(name)
    if job and job["thread"].is_alive():
        return "already running"
    state = {"status": "running", "started": time.time()}

    def target():
        try:
            state["result"] = fn(*args, **kw)
            state["status"] = "done"
        except Exception as e:  # keep the traceback for the next poll
            import traceback
            state["status"], state["error"] = "error", traceback.format_exc()[-2000:]
        state["elapsed_s"] = round(time.time() - state["started"], 1)

    state["thread"] = threading.Thread(target=target, daemon=True)
    _JOBS[name] = state
    state["thread"].start()
    return "started"


def job_status(name=None):
    names = [name] if name else list(_JOBS)
    return {n: {k: v for k, v in _JOBS[n].items() if k not in ("thread", "result")}
            | {"alive": _JOBS[n]["thread"].is_alive()} for n in names if n in _JOBS}


def parse_gold():
    """Raw .bi5 months -> data/XAUUSD_H1.csv. Verifies record layout, timestamps and
    the price scale, then drops flat zero-volume bars (market closed)."""
    recs, info = [], {"missing_months": [], "checks": {}}
    for y, m in months(*GOLD_RANGE):
        path = gold_raw_path(y, m)
        if not path.exists():
            info["missing_months"].append(f"{y}-{m:02d}")
            continue
        start_s = int(datetime(y, m, 1, tzinfo=timezone.utc).timestamp())
        month_s = int(datetime(y + m // 12, m % 12 + 1, 1, tzinfo=timezone.utc).timestamp()) - start_s
        offs = []
        for t, o, c, lo, hi, v in bi5_records(path.read_bytes()):
            offs.append(t)
            recs.append([(start_s + t) * 1000, o, hi, lo, c, v])
        info["checks"][f"{y}-{m:02d}"] = {
            "records": len(offs),
            "increasing": all(b > a for a, b in zip(offs, offs[1:])),
            "hourly_offsets": all(t % 3600 == 0 for t in offs),
            "inside_month": bool(offs) and 0 <= offs[0] and offs[-1] < month_s,
        }
    # Field order check: with (open, close, low, high) the low/high must bracket open/close.
    bad_order = sum(1 for _, o, hi, lo, c, _v in recs if not (lo <= min(o, c) and hi >= max(o, c)))
    # Price scale: the power of ten that puts the median close inside the plausible gold range.
    closes = sorted(r[4] for r in recs if r[5] > 0)
    med = closes[len(closes) // 2]
    scale = next(10 ** k for k in range(0, 7) if GOLD_PLAUSIBLE[0] <= med / 10 ** k <= GOLD_PLAUSIBLE[1])
    rows, flat_zero, zero_vol_moving = [], 0, 0
    for ts, o, hi, lo, c, v in recs:
        if v == 0 and o == hi == lo == c:
            flat_zero += 1
            continue
        if v == 0:
            zero_vol_moving += 1
        rows.append([ts, o / scale, hi / scale, lo / scale, c / scale, float(v)])
    rows, dups = dedupe_sort(rows)
    lo_p, hi_p = min(r[3] for r in rows), max(r[2] for r in rows)
    info.update({
        "source": "Dukascopy datafeed, BID_candles_hour_1.bi5 per month (XAUUSD, UTC)",
        "records": len(recs), "bad_ohlc_order": bad_order, "raw_median_close": med, "price_scale": scale,
        "flat_zero_volume_dropped": flat_zero, "zero_volume_but_moving_kept": zero_vol_moving,
        "duplicates_dropped": dups, "rows": len(rows), "price_min": lo_p, "price_max": hi_p,
        "outside_plausible_range": sum(1 for r in rows if not GOLD_PLAUSIBLE[0] <= r[4] <= GOLD_PLAUSIBLE[1]),
        "all_months_ok": all(all(v.values()) for v in info["checks"].values()),
    })
    write_candles(BASE / "data" / MARKETS["XAUUSD"]["csv"], rows)
    save_json("fetch_gold.json", info)
    return {k: v for k, v in info.items() if k != "checks"}


# ----------------------------------------------------------------------------- data description

def describe():
    out = {}
    for name, m in MARKETS.items():
        path = BASE / "data" / m["csv"]
        if not path.exists():
            out[name] = {"error": "no data file"}
            continue
        cs = load_candles(path)
        step = m["step_ms"]
        gaps = [(a[0], b[0]) for a, b in zip(cs, cs[1:]) if b[0] - a[0] != step]
        weekend, short, other = 0, 0, []
        has_weekends = name == "XAUUSD"  # crypto trades 24/7: every gap is an exchange gap
        for a, b in gaps:
            hours = (b - a) / 3600_000
            wd_a = datetime.fromtimestamp(a / 1000, timezone.utc).weekday()
            spans_weekend = has_weekends and any(
                datetime.fromtimestamp((a + k * 3600_000) / 1000, timezone.utc).weekday() == 5
                for k in range(int(hours) + 1))
            if spans_weekend:
                weekend += 1
            elif has_weekends and hours <= 3:
                short += 1
            else:
                other.append({"from": utc(a), "to": utc(b), "hours": hours, "weekday_from": wd_a})
        split = int(len(cs) * IS_FRACTION)
        out[name] = {
            "file": m["csv"], "bars": len(cs), "first_bar": utc(cs[0][0]), "last_bar": utc(cs[-1][0]),
            "sorted_unique": all(b[0] > a[0] for a, b in zip(cs, cs[1:])),
            "irregular_steps": len(gaps), "weekend_gaps": weekend, "short_weekday_gaps_le3h": short,
            "other_gaps": other[:40], "other_gaps_count": len(other),
            "non_step_aligned": sum(1 for c in cs if c[0] % step),
            "ohlc_inconsistent": sum(1 for c in cs if not (c[3] <= min(c[1], c[4]) and c[2] >= max(c[1], c[4]))),
            "min_low": min(c[3] for c in cs), "max_high": max(c[2] for c in cs),
            "in_sample": {"bars": split, "first": utc(cs[0][0]), "last": utc(cs[split - 1][0])},
            "out_of_sample": {"bars": len(cs) - split, "first": utc(cs[split][0]), "last": utc(cs[-1][0])},
        }
    save_json("data_summary.json", out)
    return out


# ----------------------------------------------------------------------------- backtests

def run_bt(candles, params, fee_pct):
    _, backtest = bt_modules()
    res = backtest.run_backtest(candles, params, equity=EQUITY, fee_pct=fee_pct)
    trades = res.pop("trade_list")
    return jsonable(res), trades


def split_windows(candles, params):
    """full; in-sample = first 70% of bars; out-of-sample = last 30%, with
    strategy.warmup(p) earlier bars prepended so the indicators are warm at the split."""
    strategy, _ = bt_modules()
    p = {**strategy.DEFAULTS, **params}
    n, w = len(candles), strategy.warmup(p)
    split = int(n * IS_FRACTION)
    return split, {
        "full": (candles, 0),
        "in_sample": (candles[:split], 0),
        "out_of_sample": (candles[split - w:], w),
    }


def window_meta(cs, warm):
    body = cs[warm:]
    return {"start": utc(body[0][0]), "end": utc(body[-1][0]), "bars": len(body), "warmup_bars_prepended": warm}


def market_candles(name):
    path = BASE / "data" / MARKETS[name]["csv"]
    return load_candles(path) if path.exists() else None


def baseline():
    strategy, _ = bt_modules()
    out, trades_out = {"_code": code_provenance()}, {}
    for name, m in MARKETS.items():
        candles = market_candles(name)
        if not candles:
            out[name] = {"error": "no data"}
            continue
        split, wins = split_windows(candles, m["params"])
        entry = {"params": {**strategy.DEFAULTS, **m["params"]}, "fee_pct": m["fee_pct"],
                 "bars_total": len(candles), "split_index": split, "split_bar": utc(candles[split][0]),
                 "windows": {}}
        for wname, (cs, warm) in wins.items():
            res, trades = run_bt(cs, m["params"], m["fee_pct"])
            if warm:  # no trade may be filled before the split
                assert all(t["entry_time"] >= candles[split][0] for t in trades)
            res["exits"] = {k: sum(1 for t in trades if t["reason"] == k) for k in ("stop", "target", "trend_break")}
            res["too_few_trades"] = res["trades"] < MIN_TRADES
            entry["windows"][wname] = {**window_meta(cs, warm), "result": res}
            trades_out[f"{name}/{wname}"] = trades
        out[name] = entry
    save_json("baseline.json", out)
    save_json("baseline_trades.json", trades_out)
    return out


def buy_and_hold(cs, fee_pct, equity=EQUITY):
    """1x buy at the first bar's open, mark at every close, sell at the last close.
    One fee on entry and one on exit (same fee_pct as the strategy)."""
    fee = fee_pct / 100
    units = equity * (1 - fee) / cs[0][1]
    curve = [units * c[4] for c in cs]
    curve[-1] *= 1 - fee
    peak, dd = equity, 0.0
    for v in curve:
        peak = max(peak, v)
        dd = max(dd, (peak - v) / peak * 100)
    return {"return_pct": round((curve[-1] / equity - 1) * 100, 2), "max_drawdown_pct": round(dd, 2),
            "price_change_pct": round((cs[-1][4] / cs[0][1] - 1) * 100, 2),
            "first_open": cs[0][1], "last_close": cs[-1][4]}


def benchmark():
    out = {}
    for name, m in MARKETS.items():
        candles = market_candles(name)
        if not candles:
            out[name] = {"error": "no data"}
            continue
        _, wins = split_windows(candles, m["params"])
        out[name] = {w: {**window_meta(cs, warm), **buy_and_hold(cs[warm:], m["fee_pct"])}
                     for w, (cs, warm) in wins.items()}
    save_json("benchmark.json", out)
    return out


def grid_cells():
    return [{"stop_atr": s, "target_atr": t, "rsi_dip": r}
            for s in GRID["stop_atr"] for t in GRID["target_atr"] for r in GRID["rsi_dip"]]


def grid(markets=None, deadline=None):
    """In-sample only. Saves results/grid_<MARKET>.json per market (resumable)."""
    t0, done = time.time(), {}
    for name in markets or MARKETS:
        if load_json(f"grid_{name}.json"):
            done[name] = "cached"
            continue
        if deadline and time.time() - t0 > deadline:
            done[name] = "pending"
            continue
        m = MARKETS[name]
        candles = market_candles(name)
        if not candles:
            done[name] = "no data"
            continue
        _, wins = split_windows(candles, m["params"])
        is_cs = wins["in_sample"][0]
        rows = []
        for cell in grid_cells():
            res, _ = run_bt(is_cs, {**m["params"], **cell}, m["fee_pct"])
            rows.append({**cell, **res, "too_few_trades": res["trades"] < MIN_TRADES})
        save_json(f"grid_{name}.json", {"market": name, "window": window_meta(is_cs, 0),
                                        "base_params": m["params"], "fee_pct": m["fee_pct"], "rows": rows})
        done[name] = round(time.time() - t0, 1)
    return done


def score(row):
    """In-sample return per unit of max drawdown (return_pct / max_drawdown_pct)."""
    return row["return_pct"] / max(row["max_drawdown_pct"], 0.01)


def idx_of(cell):
    return tuple(GRID[a].index(cell[a]) for a in AXES)


def neighbours(idx):
    for ax in range(3):
        for d in (-1, 1):
            j = list(idx)
            j[ax] += d
            if 0 <= j[ax] < len(GRID[AXES[ax]]):
                yield tuple(j)


def tier(row, base_dd):
    """2: >= 30 trades, max DD <= 2x baseline in-sample DD and return > 0.
    1: the same but not profitable in-sample (fallback only). 0: not eligible."""
    if row["trades"] < MIN_TRADES or row["max_drawdown_pct"] > 2 * base_dd:
        return 0
    return 2 if row["return_pct"] > 0 else 1


def robust_choice(scores, tiers):
    """Rule, fixed before any out-of-sample run (in-sample data only):
      score        : in-sample return_pct / max_drawdown_pct
      robust score : mean score over the cell and its face neighbours in the
                     3x3x3 grid (one step in one parameter)
      eligible     : tier 2 = >= 30 trades, max DD <= 2x the baseline's in-sample
                     max DD, and return > 0. Only if no cell is tier 2, tier 1
                     (same without the profit condition) is used, flagged.
      pick         : highest tier, then highest robust score, then highest
                     worst-neighbour score."""
    table = {}
    for idx, s in scores.items():
        hood = [idx] + list(neighbours(idx))
        vals = [scores[j] for j in hood]
        table[idx] = {"score": round(s, 3), "robust": round(sum(vals) / len(vals), 3),
                      "hood_min": round(min(vals), 3), "hood_size": len(hood), "tier": tiers[idx]}
    ranked = sorted((i for i in table if table[i]["tier"] > 0),
                    key=lambda i: (table[i]["tier"], table[i]["robust"], table[i]["hood_min"]), reverse=True)
    return (ranked[0] if ranked else None), ranked, table


def cell_params(idx):
    return {a: GRID[a][k] for a, k in zip(AXES, idx)}


STAT_KEYS = ("trades", "return_pct", "max_drawdown_pct", "win_rate_pct", "profit_factor")


def baseline_idx(name):
    defaults = bt_modules()[0].DEFAULTS
    return idx_of({a: MARKETS[name]["params"].get(a, defaults[a]) for a in AXES})


def robust_pick():
    base = load_json("baseline.json")
    out, pooled_scores, pooled_tiers = {}, {}, {}
    for name in MARKETS:
        g = load_json(f"grid_{name}.json")
        if not g:
            out[name] = {"error": "no grid"}
            continue
        base_dd = base[name]["windows"]["in_sample"]["result"]["max_drawdown_pct"]
        rows = {idx_of(r): r for r in g["rows"]}
        scores = {i: score(r) for i, r in rows.items()}
        tiers = {i: tier(r, base_dd) for i, r in rows.items()}
        pick, ranked, table = robust_choice(scores, tiers)
        b_idx = baseline_idx(name)
        best_any = max(table, key=lambda i: (table[i]["robust"], table[i]["hood_min"]))
        out[name] = {
            "pick": cell_params(pick) if pick is not None else None,
            "pick_tier": table[pick]["tier"] if pick is not None else 0,
            "pick_is_baseline": pick == b_idx,
            "pick_stats": ({**table[pick], **{k: rows[pick][k] for k in STAT_KEYS},
                            "neighbours": [{**cell_params(j), **{k: rows[j][k] for k in STAT_KEYS}}
                                           for j in neighbours(pick)]} if pick is not None else None),
            "baseline_cell": {**cell_params(b_idx), **table[b_idx], **{k: rows[b_idx][k] for k in STAT_KEYS}},
            "best_robust_ignoring_eligibility": {**cell_params(best_any), **table[best_any]},
            "top5": [{**cell_params(i), **table[i], **{k: rows[i][k] for k in STAT_KEYS}} for i in ranked[:5]],
            "tier2_cells": sum(1 for t in tiers.values() if t == 2),
            "profitable_cells": sum(1 for r in rows.values() if r["return_pct"] > 0),
            "cells_ge_30_trades": sum(1 for r in rows.values() if r["trades"] >= MIN_TRADES),
        }
        if name in CRYPTO_SYMBOLS:
            for i in scores:
                pooled_scores.setdefault(i, []).append(scores[i])
                pooled_tiers[i] = min(pooled_tiers.get(i, 2), tiers[i])
    if pooled_scores and all(len(v) == len(CRYPTO_SYMBOLS) for v in pooled_scores.values()):
        mean_scores = {i: sum(v) / len(v) for i, v in pooled_scores.items()}
        pick, ranked, table = robust_choice(mean_scores, pooled_tiers)
        out["CRYPTO_POOLED"] = {
            "note": "one setting for all three coins (the bot shares one config): score = mean of the three "
                    "coins' scores, tier = lowest tier across the coins",
            "pick": cell_params(pick) if pick is not None else None,
            "pick_tier": table[pick]["tier"] if pick is not None else 0,
            "pick_stats": {**cell_params(pick), **table[pick]} if pick is not None else None,
            "baseline_cell": {**cell_params(baseline_idx("BTC")), **table[baseline_idx("BTC")]},
            "top5": [{**cell_params(i), **table[i]} for i in ranked[:5]],
        }
    out["_rule"] = robust_choice.__doc__
    save_json("robust_pick.json", out)
    return out


def oos():
    """Run each market's robust pick once on its out-of-sample window."""
    picks, base = load_json("robust_pick.json"), load_json("baseline.json")
    out = {}
    runs = [(name, name) for name in MARKETS] + [(f"CRYPTO_POOLED/{c}", c) for c in CRYPTO_SYMBOLS]
    for key, name in runs:
        src = picks.get(key.split("/")[0]) or {}
        pick = src.get("pick")
        if not pick or "error" in base.get(name, {"error": 1}):
            out[key] = {"pick": None, "note": "no eligible pick; baseline kept"}
            continue
        m = MARKETS[name]
        candles = market_candles(name)
        params = {**m["params"], **pick}
        split, wins = split_windows(candles, params)
        cs, warm = wins["out_of_sample"]
        res, trades = run_bt(cs, params, m["fee_pct"])
        assert all(t["entry_time"] >= candles[split][0] for t in trades)
        res["too_few_trades"] = res["trades"] < MIN_TRADES
        out[key] = {"pick": pick, "pick_tier": src.get("pick_tier"), "window": window_meta(cs, warm),
                    "pick_oos": res, "baseline_oos": base[name]["windows"]["out_of_sample"]["result"]}
    save_json("oos_compare.json", out)
    return out


# ----------------------------------------------------------------------------- summary

def _pf(v):
    return v if isinstance(v, str) else f"{v:.2f}"


def summary():
    base, bench = load_json("baseline.json"), load_json("benchmark.json")
    lines = ["| Market | Window | Dates (UTC) | Bars | Trades | Return % | Max DD % | Win % | PF | B&H return % | B&H max DD % |",
             "|---|---|---|---|---|---|---|---|---|---|---|"]
    for name in MARKETS:
        if "error" in base.get(name, {"error": 1}):
            lines.append(f"| {name} | - | no data | | | | | | | | |")
            continue
        for w in ("full", "in_sample", "out_of_sample"):
            b, r, h = base[name]["windows"][w], base[name]["windows"][w]["result"], bench[name][w]
            flag = " (<30)" if r["too_few_trades"] else ""
            lines.append(f"| {name} | {w.replace('_', '-')} | {b['start'][:10]} to {b['end'][:10]} | {b['bars']} | "
                         f"{r['trades']}{flag} | {r['return_pct']:.2f} | {r['max_drawdown_pct']:.2f} | "
                         f"{r['win_rate_pct']:.1f} | {_pf(r['profit_factor'])} | {h['return_pct']:.2f} | "
                         f"{h['max_drawdown_pct']:.2f} |")
    text = "\n".join(lines)
    o = load_json("oos_compare.json")
    if o:
        rows = ["| Run | Setting (stop/target/rsi_dip) | OOS trades | OOS return % | OOS max DD % | Win % | PF |",
                "|---|---|---|---|---|---|---|"]
        for key, v in o.items():
            if not v.get("pick"):
                rows.append(f"| {key} | none | | | | | |")
                continue
            for label, r, s in (("baseline", v["baseline_oos"], None), ("robust pick", v["pick_oos"], v["pick"])):
                st = f"{s['stop_atr']}/{s['target_atr']}/{s['rsi_dip']}" if s else "live"
                flag = " (<30)" if r["trades"] < MIN_TRADES else ""
                rows.append(f"| {key} {label} | {st} | {r['trades']}{flag} | {r['return_pct']:.2f} | "
                            f"{r['max_drawdown_pct']:.2f} | {r['win_rate_pct']:.1f} | {_pf(r['profit_factor'])} |")
        text += "\n\n" + "\n".join(rows)
    return text + "\n\n" + "\n\n".join(grid_matrix(n) for n in MARKETS if load_json(f"grid_{n}.json"))


def grid_matrix(name):
    """In-sample grid as 'return % / max DD % / trades' per cell."""
    g = load_json(f"grid_{name}.json")
    rows = {idx_of(r): r for r in g["rows"]}
    b_idx = baseline_idx(name)
    lines = [f"{name} in-sample grid ({g['window']['start'][:10]} to {g['window']['end'][:10]}): "
             "return % / max DD % / trades (* = baseline cell)",
             "| stop_atr | target_atr | " + " | ".join(f"rsi_dip {r}" for r in GRID["rsi_dip"]) + " |",
             "|---|---|---|---|---|"]
    for i, s in enumerate(GRID["stop_atr"]):
        for j, t in enumerate(GRID["target_atr"]):
            cells = []
            for k in range(len(GRID["rsi_dip"])):
                r = rows[(i, j, k)]
                mark = "*" if (i, j, k) == b_idx else ""
                cells.append(f"{mark}{r['return_pct']:.1f} / {r['max_drawdown_pct']:.1f} / {r['trades']}")
            lines.append(f"| {s} | {t} | " + " | ".join(cells) + " |")
    return "\n".join(lines)


STEPS = {
    "fetch-crypto": fetch_crypto,
    "fetch-gold": lambda: (fetch_gold_raw(), parse_gold())[1],
    "describe": describe,
    "baseline": baseline,
    "benchmark": benchmark,
    "grid": lambda: (grid(), robust_pick())[1],
    "oos": oos,
    "summary": summary,
}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("steps", nargs="+", choices=list(STEPS) + ["all"])
    ap.add_argument("--base", default=str(BASE), help="work directory (data, results, raw cache)")
    ap.add_argument("--code-dir", help="directory that contains the trading/ package (default: --base)")
    a = ap.parse_args(argv)
    setup(a.base, a.code_dir)
    for step in (list(STEPS) if "all" in a.steps else a.steps):
        print(f"== {step}", flush=True)
        res = STEPS[step]()
        print(res if isinstance(res, str) else json.dumps(res, indent=1, default=str)[:3000], flush=True)


if __name__ == "__main__":
    main()
