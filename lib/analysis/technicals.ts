import { atr, average, Candle, ema, latestFinite } from "./indicators";

export type TechnicalSignal = "BULLISH" | "BEARISH" | "NEUTRAL";

export type HoldConfidence = "LOW" | "MEDIUM" | "HIGH";

export type TechnicalEvaluation = {
  signal: TechnicalSignal;
  price: number;
  volume: number;
  ema20: number;
  ema50: number;
  ema200: number;
  avgVolume20: number;
  reasons: string[];
  // Heuristic swing-hold suggestion derived from trend strength + volatility.
  // NOT a guaranteed forecast — informational only.
  holdMinDays: number;
  holdMaxDays: number;
  holdConfidence: HoldConfidence;
  exitRule: string;
};

// Suggests a swing holding window from trend strength (EMA20-EMA200 spread) and
// volatility (ATR as a fraction of price). A wide, steady trend warrants a longer
// hold; a choppy or marginal one a shorter hold. Heuristic, not a forecast.
function suggestHold(
  signal: TechnicalSignal,
  trendStrength: number,
  volatility: number
): { holdMinDays: number; holdMaxDays: number; holdConfidence: HoldConfidence; exitRule: string } {
  if (signal === "NEUTRAL") {
    return {
      holdMinDays: 0,
      holdMaxDays: 0,
      holdConfidence: "LOW",
      exitRule: "No directional setup — stay flat until a trend forms."
    };
  }

  // Base window scales with trend strength; volatility shrinks it (choppier = shorter).
  const strengthScore = Math.min(trendStrength / 0.15, 1); // 15%+ EMA spread = max strength
  const volPenalty = Math.min(volatility / 0.04, 1); // 4%+ daily ATR = max chop

  const baseMax = 5 + Math.round(strengthScore * 20); // 5–25 trading days
  const holdMaxDays = Math.max(3, Math.round(baseMax * (1 - volPenalty * 0.5)));
  const holdMinDays = Math.max(2, Math.round(holdMaxDays * 0.5));

  const holdConfidence: HoldConfidence =
    strengthScore > 0.6 && volPenalty < 0.5 ? "HIGH" : strengthScore > 0.3 ? "MEDIUM" : "LOW";

  const exitRule =
    signal === "BULLISH"
      ? "Exit if the price closes below EMA50, or at the suggested horizon."
      : "Cover if the price closes back above EMA50, or at the suggested horizon.";

  return { holdMinDays, holdMaxDays, holdConfidence, exitRule };
}

// Widened from 0.02 — the strict 2% gate plus a volume surge meant a BULLISH
// signal essentially never fired on daily data. These now feed the reasons list
// as strength boosters rather than acting as hard gates on the signal itself.
const nearEmaThreshold = 0.05;
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

  // Core trend: EMA stack aligned and price on the right side of the long EMA.
  // Price-near-EMA20 and the volume surge are now strength boosters (see reasons),
  // not requirements, so a clean uptrend actually registers as BULLISH.
  const bullish = ema20 > ema50 && ema50 > ema200 && latest.close > ema200;

  const bearish = ema20 < ema50 && ema50 < ema200 && latest.close < ema200;

  const reasons: string[] = [];
  if (ema20 > ema50 && ema50 > ema200) reasons.push("EMA20 > EMA50 > EMA200");
  if (ema20 < ema50 && ema50 < ema200) reasons.push("EMA20 < EMA50 < EMA200");
  if (latest.close > ema200) reasons.push("Price above EMA200");
  if (latest.close < ema200) reasons.push("Price below EMA200");
  if (priceNearEma20) reasons.push("Price within 5% of EMA20");
  if (volumeSurge) reasons.push("Volume above 1.5x 20-day average");

  const signal: TechnicalSignal = bullish ? "BULLISH" : bearish ? "BEARISH" : "NEUTRAL";
  const trendStrength = Math.abs(ema20 - ema200) / ema200;
  const volatility = atr(candles) / latest.close;
  const hold = suggestHold(signal, trendStrength, volatility);

  return {
    signal,
    price: latest.close,
    volume: latest.volume,
    ema20,
    ema50,
    ema200,
    avgVolume20,
    reasons,
    ...hold
  };
}
