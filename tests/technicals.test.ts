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

describe("evaluateTechnicals", () => {
  it("identifies bullish swing setups near EMA20 with a volume surge", () => {
    const base = Array.from({ length: 240 }, (_, index) => candle(100 + index * 0.2, 1000));
    const nearTrendPrice = base[base.length - 1].close;
    const candles = [...base, candle(nearTrendPrice, 3000)];

    const result = evaluateTechnicals(candles);

    expect(result.signal).toBe("BULLISH");
    expect(result.reasons).toContain("EMA20 > EMA50 > EMA200");
    expect(result.reasons).toContain("Volume above 1.5x 20-day average");
  });

  it("identifies bearish trend setups below EMA200", () => {
    const candles = Array.from({ length: 250 }, (_, index) => candle(250 - index * 0.5, 1000));

    const result = evaluateTechnicals(candles);

    expect(result.signal).toBe("BEARISH");
    expect(result.reasons).toContain("EMA20 < EMA50 < EMA200");
  });

  it("rejects insufficient history", () => {
    expect(() => evaluateTechnicals(Array.from({ length: 50 }, () => candle(100)))).toThrow(
      "At least 200 candles"
    );
  });
});
