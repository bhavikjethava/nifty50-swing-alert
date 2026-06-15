import { average, Candle, ema, latestFinite } from "./indicators";

export type TechnicalSignal = "BULLISH" | "BEARISH" | "NEUTRAL";

export type TechnicalEvaluation = {
  signal: TechnicalSignal;
  price: number;
  volume: number;
  ema20: number;
  ema50: number;
  ema200: number;
  avgVolume20: number;
  reasons: string[];
};

const nearEmaThreshold = 0.02;
const volumeSurgeMultiplier = 1.5;

export function evaluateTechnicals(candles: Candle[]): TechnicalEvaluation {
  if (candles.length < 200) {
    throw new Error("At least 200 candles are required for EMA200 evaluation.");
  }

  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const latest = candles[candles.length - 1];
  const ema20 = latestFinite(ema(closes, 20));
  const ema50 = latestFinite(ema(closes, 50));
  const ema200 = latestFinite(ema(closes, 200));
  const avgVolume20 = average(volumes.slice(-20));

  if (!ema20 || !ema50 || !ema200 || avgVolume20 === 0) {
    throw new Error("Unable to calculate required indicators.");
  }

  const priceNearEma20 = Math.abs(latest.close - ema20) / ema20 <= nearEmaThreshold;
  const volumeSurge = latest.volume > volumeSurgeMultiplier * avgVolume20;

  const bullish =
    ema20 > ema50 &&
    ema50 > ema200 &&
    latest.close > ema200 &&
    priceNearEma20 &&
    volumeSurge;

  const bearish = ema20 < ema50 && ema50 < ema200 && latest.close < ema200;

  const reasons: string[] = [];
  if (ema20 > ema50 && ema50 > ema200) reasons.push("EMA20 > EMA50 > EMA200");
  if (ema20 < ema50 && ema50 < ema200) reasons.push("EMA20 < EMA50 < EMA200");
  if (latest.close > ema200) reasons.push("Price above EMA200");
  if (latest.close < ema200) reasons.push("Price below EMA200");
  if (priceNearEma20) reasons.push("Price within 2% of EMA20");
  if (volumeSurge) reasons.push("Volume above 1.5x 20-day average");

  return {
    signal: bullish ? "BULLISH" : bearish ? "BEARISH" : "NEUTRAL",
    price: latest.close,
    volume: latest.volume,
    ema20,
    ema50,
    ema200,
    avgVolume20,
    reasons
  };
}
