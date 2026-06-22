export type Candle = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function ema(values: number[], period: number): number[] {
  if (values.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  const results = Array(period - 1).fill(Number.NaN) as number[];
  let previous = seed;
  results.push(seed);

  for (let index = period; index < values.length; index += 1) {
    previous = (values[index] - previous) * multiplier + previous;
    results.push(previous);
  }

  return results;
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Average True Range over the last `period` candles — a volatility measure.
export function atr(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const prevClose = candles[i - 1].close;
    const range = Math.max(
      current.high - current.low,
      Math.abs(current.high - prevClose),
      Math.abs(current.low - prevClose)
    );
    trueRanges.push(range);
  }

  return average(trueRanges.slice(-period));
}

// Relative Strength Index (Wilder's smoothing) over `period` closes.
export function rsi(closes: number[], period = 14): number[] {
  if (closes.length <= period) return [];

  const results: number[] = Array(period).fill(Number.NaN);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  results.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    results.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return results;
}

export function latestFinite(values: number[]): number | undefined {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) {
      return values[index];
    }
  }

  return undefined;
}
