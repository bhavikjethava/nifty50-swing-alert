import { describe, expect, it } from "vitest";
import { Candle } from "@/lib/analysis/indicators";
import { backtestSymbol } from "@/lib/analysis/backtest";

function candle(close: number, vol = 1000): Candle {
  return { date: new Date(), open: close, high: close + 1, low: close - 1, close, volume: vol };
}

describe("backtestSymbol", () => {
  it("returns null when there is insufficient history", () => {
    const candles = Array.from({ length: 50 }, () => candle(100));
    expect(backtestSymbol("TEST.NS", candles)).toBeNull();
  });

  it("scores a sustained uptrend as profitable bullish trades", () => {
    const candles = Array.from({ length: 300 }, (_, i) => candle(100 + i * 0.5));
    const result = backtestSymbol("TEST.NS", candles);

    expect(result).not.toBeNull();
    expect(result!.trades).toBeGreaterThan(0);
    // In a clean uptrend, bullish signals should win the large majority of the time.
    expect(result!.winRate).toBeGreaterThan(50);
    expect(result!.avgReturnPct).toBeGreaterThan(0);
  });
});
