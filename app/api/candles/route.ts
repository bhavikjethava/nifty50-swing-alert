import { ema } from "@/lib/analysis/indicators";
import { getDailyCandles } from "@/lib/scanners/yahoo";
import { json } from "@/lib/server/http";

// Daily candles change at most once per trading day, but the dashboard auto-refreshes
// every 5 minutes. Cache per symbol so refreshes don't re-hit Yahoo and trip its rate limit.
type CachedChart = { payload: unknown; at: number };
const cache = new Map<string, CachedChart>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Returns daily OHLCV candles plus EMA20/50/200 overlays for a single symbol,
// shaped for TradingView Lightweight Charts (time = unix seconds).
export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!symbol) {
    return json({ error: "symbol query parameter is required" }, { status: 400 });
  }

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return json(cached.payload);
  }

  try {
    // Interactive endpoint: fail fast (1 retry) so the chart shows an error
    // quickly instead of blocking on the scanner's long rate-limit backoff.
    const candles = await getDailyCandles(symbol, 1);
    if (candles.length === 0) {
      return json({ error: "No candle data available for symbol" }, { status: 404 });
    }

    const closes = candles.map((candle) => candle.close);
    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const ema200 = ema(closes, 200);

    const time = (date: Date) => Math.floor(date.getTime() / 1000);
    const overlay = (series: number[]) =>
      candles
        .map((candle, index) => ({ time: time(candle.date), value: series[index] }))
        .filter((point) => Number.isFinite(point.value));

    const payload = {
      symbol,
      candles: candles.map((candle) => ({
        time: time(candle.date),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      })),
      ema20: overlay(ema20),
      ema50: overlay(ema50),
      ema200: overlay(ema200)
    };

    cache.set(symbol, { payload, at: Date.now() });
    return json(payload);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const rateLimited = /too many requests|429/i.test(raw);
    const message = rateLimited
      ? "Yahoo Finance is rate-limiting requests right now. Try again in a few minutes."
      : "Failed to fetch candle data for this symbol.";
    return json({ error: message }, { status: rateLimited ? 429 : 502 });
  }
}
