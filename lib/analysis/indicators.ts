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

export function latestFinite(values: number[]): number | undefined {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) {
      return values[index];
    }
  }

  return undefined;
}
