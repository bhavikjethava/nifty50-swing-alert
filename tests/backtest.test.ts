import { describe, expect, it } from "vitest";
import { Candle } from "@/lib/analysis/indicators";
import { backtestSymbol } from "@/lib/analysis/backtest";

function candle(close: number, vol = 1000): Candle {
  return { date: new Date(), open: close, high: close + 1, low: close - 1, close, volume: vol };
}

describe("backtestSymbol (mean-reversion)", () => {
  it("returns null when there is insufficient history", () => {
    const candles = Array.from({ length: 50 }, () => candle(100));
    expect(backtestSymbol("TEST.NS", candles)).toBeNull();
  });

  it("records trades when oversold dips occur and recover", () => {
    // Flat base, then repeated dip-and-recover cycles to trigger oversold buys.
    const base = Array.from({ length: 210 }, () => candle(100));
    const cycles: Candle[] = [];
    for (let c = 0; c < 4; c += 1) {
      for (let i = 0; i < 12; i += 1) cycles.push(candle(100 - (i + 1) * 2)); // drop → oversold
      for (let i = 0; i < 18; i += 1) cycles.push(candle(76 + (i + 1) * 1.5)); // recover
    }
    const result = backtestSymbol("TEST.NS", [...base, ...cycles]);

    expect(result).not.toBeNull();
    expect(result!.trades).toBeGreaterThan(0);
  });
});
