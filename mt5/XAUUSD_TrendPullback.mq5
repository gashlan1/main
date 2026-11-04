//+------------------------------------------------------------------+
//|                                       XAUUSD_TrendPullback.mq5   |
//|  Trend-pullback Expert Advisor for gold (XAUUSD) on MetaTrader 5 |
//|                                                                  |
//|  Same rules as trading/strategy.py (the Python reference):       |
//|   Trend : close > slow EMA and fast EMA > slow EMA               |
//|   Entry : RSI dipped below RsiDip within DipLookback bars, then  |
//|           crosses back above RsiEntry on the last closed bar     |
//|   Stop  : StopATR * ATR, sent to the server with the order       |
//|   Target: TargetATR * ATR                                        |
//|   Manage: breakeven at BreakevenR, ATR trailing stop,            |
//|           exit on close below slow EMA                           |
//|  Shorts mirror the rules when AllowShorts = true.                |
//|                                                                  |
//|  Risk  : RiskPct of equity per trade, daily loss lock, max       |
//|          trades per day, spread filter, session filter, Friday   |
//|          close. Test on a demo account / Strategy Tester first.  |
//+------------------------------------------------------------------+
#property copyright "gashlan1"
#property version   "1.00"
#property description "Gold trend-pullback EA with ATR stops and hard risk limits"

#include <Trade\Trade.mqh>

input group "Strategy"
input ENUM_TIMEFRAMES InpTimeframe   = PERIOD_H1;
input int             InpFastEMA     = 50;
input int             InpSlowEMA     = 200;
input int             InpRsiPeriod   = 14;
input double          InpRsiDip      = 40.0;
input double          InpRsiEntry    = 50.0;
input int             InpDipLookback = 6;
input int             InpAtrPeriod   = 14;
input double          InpStopATR     = 1.5;
input double          InpTargetATR   = 3.0;
input double          InpTrailATR    = 2.0;
input double          InpBreakevenR  = 1.0;   // move stop to entry after this many R (0 = off)
input bool            InpAllowShorts = false;

input group "Risk"
input bool   InpTradingEnabled  = true;   // kill switch
input double InpRiskPct         = 0.5;    // % of equity lost if the stop is hit
input double InpMaxDailyLossPct = 2.0;    // close all and stop for the day at this drawdown
input int    InpMaxTradesPerDay = 2;
input int    InpMaxSpreadPoints = 60;     // skip entries when the spread is wider
input double InpMaxMarginPct    = 30.0;   // never use more than this % of free margin

input group "Session (broker server time)"
input int  InpStartHour       = 8;
input int  InpEndHour         = 20;
input bool InpCloseFriday     = true;
input int  InpFridayCloseHour = 20;

input group "General"
input ulong InpMagic     = 20261104;
input int   InpSlippage  = 30;

CTrade   trade;
int      hFast = INVALID_HANDLE, hSlow = INVALID_HANDLE, hRsi = INVALID_HANDLE, hAtr = INVALID_HANDLE;
datetime lastBar = 0;
string   gvDay, gvEquity;

//+------------------------------------------------------------------+
int OnInit()
  {
   if(InpFastEMA >= InpSlowEMA || InpRiskPct <= 0 || InpRiskPct > 5 || InpStopATR <= 0)
     {
      Print("Invalid inputs: need FastEMA < SlowEMA, 0 < RiskPct <= 5, StopATR > 0");
      return(INIT_PARAMETERS_INCORRECT);
     }
   hFast = iMA(_Symbol, InpTimeframe, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   hSlow = iMA(_Symbol, InpTimeframe, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   hRsi  = iRSI(_Symbol, InpTimeframe, InpRsiPeriod, PRICE_CLOSE);
   hAtr  = iATR(_Symbol, InpTimeframe, InpAtrPeriod);
   if(hFast == INVALID_HANDLE || hSlow == INVALID_HANDLE || hRsi == INVALID_HANDLE || hAtr == INVALID_HANDLE)
     {
      Print("Failed to create indicator handles: ", GetLastError());
      return(INIT_FAILED);
     }
   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippage);
   trade.SetTypeFillingBySymbol(_Symbol);
   gvDay    = StringFormat("TPB_%I64u_%s_day", InpMagic, _Symbol);
   gvEquity = StringFormat("TPB_%I64u_%s_eq", InpMagic, _Symbol);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   IndicatorRelease(hFast);
   IndicatorRelease(hSlow);
   IndicatorRelease(hRsi);
   IndicatorRelease(hAtr);
  }

//+------------------------------------------------------------------+
datetime DayStart(datetime t)
  {
   MqlDateTime s;
   TimeToStruct(t, s);
   s.hour = 0; s.min = 0; s.sec = 0;
   return(StructToTime(s));
  }

//+------------------------------------------------------------------+
//| Day-start equity, kept in a terminal global so restarts keep it  |
//+------------------------------------------------------------------+
double DayStartEquity()
  {
   double today = (double)DayStart(TimeCurrent());
   if(!GlobalVariableCheck(gvDay) || GlobalVariableGet(gvDay) != today)
     {
      GlobalVariableSet(gvDay, today);
      GlobalVariableSet(gvEquity, AccountInfoDouble(ACCOUNT_EQUITY));
     }
   return(GlobalVariableGet(gvEquity));
  }

//+------------------------------------------------------------------+
bool DailyLossHit()
  {
   double start = DayStartEquity();
   if(start <= 0) return(false);
   return((start - AccountInfoDouble(ACCOUNT_EQUITY)) / start * 100.0 >= InpMaxDailyLossPct);
  }

//+------------------------------------------------------------------+
int TradesToday()
  {
   if(!HistorySelect(DayStart(TimeCurrent()), TimeCurrent() + 60)) return(0);
   int n = 0;
   for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
     {
      ulong d = HistoryDealGetTicket(i);
      if(HistoryDealGetString(d, DEAL_SYMBOL) == _Symbol &&
         (ulong)HistoryDealGetInteger(d, DEAL_MAGIC) == InpMagic &&
         HistoryDealGetInteger(d, DEAL_ENTRY) == DEAL_ENTRY_IN)
         n++;
     }
   return(n);
  }

//+------------------------------------------------------------------+
//| Ticket of this EA's open position on this symbol, or 0           |
//+------------------------------------------------------------------+
ulong MyPosition()
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong t = PositionGetTicket(i);
      if(t > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol &&
         (ulong)PositionGetInteger(POSITION_MAGIC) == InpMagic)
         return(t);
     }
   return(0);
  }

//+------------------------------------------------------------------+
void CloseMine(string why)
  {
   ulong t = MyPosition();
   if(t == 0) return;
   if(trade.PositionClose(t))
      PrintFormat("Closed #%I64u: %s", t, why);
   else
      PrintFormat("Close #%I64u failed (%s): %u %s", t, why, trade.ResultRetcode(), trade.ResultRetcodeDescription());
  }

//+------------------------------------------------------------------+
bool InSession()
  {
   MqlDateTime s;
   TimeToStruct(TimeCurrent(), s);
   if(s.day_of_week == 0 || s.day_of_week == 6) return(false);
   if(InpCloseFriday && s.day_of_week == 5 && s.hour >= InpFridayCloseHour) return(false);
   if(InpStartHour <= InpEndHour)
      return(s.hour >= InpStartHour && s.hour < InpEndHour);
   return(s.hour >= InpStartHour || s.hour < InpEndHour);   // session wraps midnight
  }

//+------------------------------------------------------------------+
//| Lots so that hitting the stop loses RiskPct of equity            |
//+------------------------------------------------------------------+
double LotsForRisk(ENUM_ORDER_TYPE type, double price, double sl)
  {
   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * InpRiskPct / 100.0;
   double pnlOneLot = 0;
   if(!OrderCalcProfit(type, _Symbol, 1.0, price, sl, pnlOneLot) || pnlOneLot >= 0)
      return(0);
   double lots = riskMoney / -pnlOneLot;

   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   double vmin = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double vmax = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);

   double marginOneLot = 0;
   if(OrderCalcMargin(type, _Symbol, 1.0, price, marginOneLot) && marginOneLot > 0)
      lots = MathMin(lots, AccountInfoDouble(ACCOUNT_MARGIN_FREE) * InpMaxMarginPct / 100.0 / marginOneLot);

   lots = MathFloor(lots / step) * step;
   if(lots < vmin) return(0);   // never round risk up to the minimum lot
   return(NormalizeDouble(MathMin(lots, vmax), 2));
  }

//+------------------------------------------------------------------+
bool Buffers(double &fast[], double &slow[], double &rsi[], double &atr[], double &close[])
  {
   int need = InpDipLookback + 3;
   ArraySetAsSeries(fast, true);
   ArraySetAsSeries(slow, true);
   ArraySetAsSeries(rsi, true);
   ArraySetAsSeries(atr, true);
   ArraySetAsSeries(close, true);
   return(CopyBuffer(hFast, 0, 0, 3, fast) == 3 &&
          CopyBuffer(hSlow, 0, 0, 3, slow) == 3 &&
          CopyBuffer(hRsi, 0, 0, need, rsi) == need &&
          CopyBuffer(hAtr, 0, 0, 3, atr) == 3 &&
          CopyClose(_Symbol, InpTimeframe, 0, 3, close) == 3);
  }

//+------------------------------------------------------------------+
//| +1 long, -1 short, 0 none -- evaluated on closed bar 1           |
//+------------------------------------------------------------------+
int Signal(const double &fast[], const double &slow[], const double &rsi[], const double &close[])
  {
   double lo = 100, hi = 0;
   for(int k = 2; k <= InpDipLookback + 1; k++)
     {
      lo = MathMin(lo, rsi[k]);
      hi = MathMax(hi, rsi[k]);
     }
   bool up   = close[1] > slow[1] && fast[1] > slow[1];
   bool down = close[1] < slow[1] && fast[1] < slow[1];
   if(up && lo < InpRsiDip && rsi[2] <= InpRsiEntry && rsi[1] > InpRsiEntry)
      return(1);
   if(InpAllowShorts && down && hi > 100 - InpRsiDip &&
      rsi[2] >= 100 - InpRsiEntry && rsi[1] < 100 - InpRsiEntry)
      return(-1);
   return(0);
  }

//+------------------------------------------------------------------+
void ManagePosition(ulong t, double atr1, double close1, double slow1)
  {
   if(!PositionSelectByTicket(t)) return;
   long   type = PositionGetInteger(POSITION_TYPE);
   double open = PositionGetDouble(POSITION_PRICE_OPEN);
   double sl   = PositionGetDouble(POSITION_SL);
   double tp   = PositionGetDouble(POSITION_TP);
   double bid  = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask  = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double minDist = (SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) + 1) * _Point;
   double rDist = InpStopATR * atr1;

   if(type == POSITION_TYPE_BUY)
     {
      if(close1 < slow1) { CloseMine("trend break"); return; }
      double newSl = sl;
      if(InpBreakevenR > 0 && bid - open >= InpBreakevenR * rDist) newSl = MathMax(newSl, open);
      newSl = MathMax(newSl, bid - InpTrailATR * atr1);
      newSl = NormalizeDouble(newSl, _Digits);
      if(newSl > sl + _Point && bid - newSl >= minDist)
         trade.PositionModify(t, newSl, tp);
     }
   else
     {
      if(close1 > slow1) { CloseMine("trend break"); return; }
      double newSl = (sl == 0) ? DBL_MAX : sl;
      if(InpBreakevenR > 0 && open - ask >= InpBreakevenR * rDist) newSl = MathMin(newSl, open);
      newSl = MathMin(newSl, ask + InpTrailATR * atr1);
      newSl = NormalizeDouble(newSl, _Digits);
      if((sl == 0 || newSl < sl - _Point) && newSl - ask >= minDist)
         trade.PositionModify(t, newSl, tp);
     }
  }

//+------------------------------------------------------------------+
void TryEnter(int dir, double atr1)
  {
   if(!InpTradingEnabled || !InSession()) return;
   if(TradesToday() >= InpMaxTradesPerDay) { Print("Skip: max trades per day"); return; }
   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > InpMaxSpreadPoints) { PrintFormat("Skip: spread %I64d > %d", spread, InpMaxSpreadPoints); return; }

   double minDist = (SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) + 1) * _Point;
   double dist = MathMax(InpStopATR * atr1, minDist);
   ENUM_ORDER_TYPE type = dir > 0 ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   double price = dir > 0 ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = NormalizeDouble(price - dir * dist, _Digits);
   double tp = NormalizeDouble(price + dir * InpTargetATR * atr1, _Digits);
   double lots = LotsForRisk(type, price, sl);
   if(lots <= 0) { Print("Skip: risk too small for minimum lot (raise equity or RiskPct)"); return; }

   bool ok = dir > 0 ? trade.Buy(lots, _Symbol, price, sl, tp, "TPB long")
                     : trade.Sell(lots, _Symbol, price, sl, tp, "TPB short");
   PrintFormat("%s %.2f lots @ %.2f SL %.2f TP %.2f -> %s", dir > 0 ? "BUY" : "SELL",
               lots, price, sl, tp, ok ? "ok" : trade.ResultRetcodeDescription());
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   ulong t = MyPosition();

   if(DailyLossHit())
     {
      if(t != 0) CloseMine("daily loss limit");
      return;
     }
   if(t != 0 && InpCloseFriday)
     {
      MqlDateTime s;
      TimeToStruct(TimeCurrent(), s);
      if(s.day_of_week == 5 && s.hour >= InpFridayCloseHour) { CloseMine("Friday close"); return; }
     }

   datetime bar = iTime(_Symbol, InpTimeframe, 0);
   if(bar == lastBar) return;   // everything below runs once per new bar

   double fast[], slow[], rsi[], atr[], close[];
   if(!Buffers(fast, slow, rsi, atr, close)) return;   // indicators not ready; retry next tick
   lastBar = bar;

   if(t != 0)
     {
      ManagePosition(t, atr[1], close[1], slow[1]);
      return;
     }
   int dir = Signal(fast, slow, rsi, close);
   if(dir != 0) TryEnter(dir, atr[1]);
  }
//+------------------------------------------------------------------+
