import { describe, expect, it } from "vitest";
import { Candle } from "@/lib/analysis/indicators";
import { evaluateTechnicals } from "@/lib/analysis/technicals";

function candle(close: number, volume = 1000): Candle {
  return {
    date: new Date(),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume
  };
}

describe("evaluateTechnicals (mean-reversion)", () => {
  it("flags an oversold sell-off as BULLISH (mean-reversion buy)", () => {
    // Long flat history, then a sharp sustained drop drives RSI below 30.
    const flat = Array.from({ length: 230 }, () => candle(100));
    const selloff = Array.from({ length: 15 }, (_, i) => candle(100 - (i + 1) * 2));
    const result = evaluateTechnicals([...flat, ...selloff]);

    expect(result.signal).toBe("BULLISH");
    expect(result.reasons.some((r) => r.includes("Oversold"))).toBe(true);
    expect(result.holdMaxDays).toBeGreaterThan(0);
  });

  it("flags an overbought rally as BEARISH (informational, not a buy)", () => {
    const flat = Array.from({ length: 230 }, () => candle(100));
    const rally = Array.from({ length: 15 }, (_, i) => candle(100 + (i + 1) * 2));
    const result = evaluateTechnicals([...flat, ...rally]);

    expect(result.signal).toBe("BEARISH");
    expect(result.holdMaxDays).toBe(0);
  });

  it("rejects insufficient history", () => {
    expect(() => evaluateTechnicals(Array.from({ length: 50 }, () => candle(100)))).toThrow(
      "At least 200 candles"
    );
  });
});
