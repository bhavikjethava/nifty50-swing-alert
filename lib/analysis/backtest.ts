import { Candle, ema, latestFinite } from "./indicators";
import { evaluateTechnicals } from "./technicals";

export type Trade = {
  signal: "BULLISH" | "BEARISH";
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  // Return in the trade's direction: positive = the signal was right.
  returnPct: number;
  heldDays: number;
  exitReason: "horizon" | "ema50-cross" | "end-of-data";
};

export type BacktestResult = {
  symbol: string;
  trades: number;
  wins: number;
  winRate: number;
  avgReturnPct: number;
  totalReturnPct: number;
  buyHoldReturnPct: number;
  avgHeldDays: number;
};

const MIN_HISTORY = 201; // need EMA200 + one more candle

// Replays the technical rules across a single symbol's candle history and simulates
// each BULLISH/BEARISH signal as a swing trade exited at the suggested hold horizon
// or when price closes back across EMA50. Returns per-symbol performance stats.
export function backtestSymbol(symbol: string, candles: Candle[]): BacktestResult | null {
  if (candles.length < MIN_HISTORY + 10) return null;

  const trades: Trade[] = [];
  let cursor = MIN_HISTORY;

  while (cursor < candles.length - 1) {
    const window = candles.slice(0, cursor + 1);
    let evaluation;
    try {
      evaluation = evaluateTechnicals(window);
    } catch {
      cursor += 1;
      continue;
    }

    if (evaluation.signal === "NEUTRAL") {
      cursor += 1;
      continue;
    }

    const signal = evaluation.signal;
    const entryIndex = cursor;
    const entryPrice = candles[entryIndex].close;
    const horizon = Math.max(evaluation.holdMaxDays, 1);

    // Walk forward to the exit: hold horizon, or an EMA50 close-cross against us.
    let exitIndex = Math.min(entryIndex + horizon, candles.length - 1);
    let exitReason: Trade["exitReason"] = exitIndex === candles.length - 1 ? "end-of-data" : "horizon";

    for (let i = entryIndex + 1; i <= Math.min(entryIndex + horizon, candles.length - 1); i += 1) {
      const ema50 = latestFinite(ema(candles.slice(0, i + 1).map((c) => c.close), 50));
      if (ema50 == null) continue;
      const close = candles[i].close;
      const crossed = signal === "BULLISH" ? close < ema50 : close > ema50;
      if (crossed) {
        exitIndex = i;
        exitReason = "ema50-cross";
        break;
      }
    }

    const exitPrice = candles[exitIndex].close;
    const rawReturn = (exitPrice - entryPrice) / entryPrice;
    const directedReturn = signal === "BULLISH" ? rawReturn : -rawReturn;

    trades.push({
      signal,
      entryIndex,
      exitIndex,
      entryPrice,
      exitPrice,
      returnPct: directedReturn * 100,
      heldDays: exitIndex - entryIndex,
      exitReason
    });

    // Resume after the trade closes (no overlapping trades).
    cursor = exitIndex + 1;
  }

  const wins = trades.filter((t) => t.returnPct > 0).length;
  const totalReturn = trades.reduce((sum, t) => sum + t.returnPct, 0);
  const avgHeld = trades.length ? trades.reduce((s, t) => s + t.heldDays, 0) / trades.length : 0;
  const first = candles[MIN_HISTORY].close;
  const last = candles[candles.length - 1].close;

  return {
    symbol,
    trades: trades.length,
    wins,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    avgReturnPct: trades.length ? totalReturn / trades.length : 0,
    totalReturnPct: totalReturn,
    buyHoldReturnPct: ((last - first) / first) * 100,
    avgHeldDays: avgHeld
  };
}

export type AggregateBacktest = {
  symbols: number;
  totalTrades: number;
  overallWinRate: number;
  avgReturnPerTrade: number;
  avgVsBuyHold: number;
  perSymbol: BacktestResult[];
};

export function aggregateBacktests(results: BacktestResult[]): AggregateBacktest {
  const withTrades = results.filter((r) => r.trades > 0);
  const totalTrades = withTrades.reduce((s, r) => s + r.trades, 0);
  const totalWins = withTrades.reduce((s, r) => s + r.wins, 0);
  const sumReturn = withTrades.reduce((s, r) => s + r.totalReturnPct, 0);
  const avgVsBuyHold = withTrades.length
    ? withTrades.reduce((s, r) => s + (r.totalReturnPct - r.buyHoldReturnPct), 0) / withTrades.length
    : 0;

  return {
    symbols: withTrades.length,
    totalTrades,
    overallWinRate: totalTrades ? (totalWins / totalTrades) * 100 : 0,
    avgReturnPerTrade: totalTrades ? sumReturn / totalTrades : 0,
    avgVsBuyHold,
    perSymbol: results.slice().sort((a, b) => b.winRate - a.winRate)
  };
}
