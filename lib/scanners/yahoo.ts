import yahooFinance from "yahoo-finance2";
import { subDays } from "date-fns";
import { Candle } from "@/lib/analysis/indicators";

yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A browser-like UA avoids the rate-limit/crumb wall the yahoo-finance2 library hits.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36";
const CHART_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

function isRateLimited(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /too many requests|429|edge: /i.test(message);
}

function toCandles(
  rows: Array<{ date: Date; open: unknown; high: unknown; low: unknown; close: unknown; volume: unknown }>
): Candle[] {
  return rows
    .filter((row) => row.open && row.high && row.low && row.close && row.volume)
    .slice(-250)
    .map((row) => ({
      date: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume)
    }));
}

// Parse Yahoo's chart JSON payload into candles.
function parseChartPayload(payload: unknown): Candle[] {
  const result = (payload as { chart?: { result?: unknown[] } })?.chart?.result?.[0] as
    | { timestamp?: number[]; indicators?: { quote?: Array<Record<string, unknown[]>> } }
    | undefined;
  const timestamps: number[] = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0] ?? {};

  const rows = timestamps.map((ts, index) => ({
    date: new Date(ts * 1000),
    open: quote.open?.[index],
    high: quote.high?.[index],
    low: quote.low?.[index],
    close: quote.close?.[index],
    volume: quote.volume?.[index]
  }));

  const candles = toCandles(rows);
  if (candles.length === 0) throw new Error("Empty chart payload");
  return candles;
}

// Fallback: call Yahoo's public chart endpoint directly. The library's crumb/cookie
// handshake is what trips the rate limit; a plain fetch with a browser UA avoids it.
async function fetchChartDirect(symbol: string): Promise<Candle[]> {
  let lastError: unknown;

  for (const host of CHART_HOSTS) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
      const response = await fetch(url, { headers: { "User-Agent": BROWSER_UA } });
      if (!response.ok) {
        throw new Error(`Yahoo chart ${response.status}`);
      }
      return parseChartPayload(await response.json());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

// Fallback: fetch the same Yahoo chart URL through the free r.jina.ai reader proxy.
// The request originates from Jina's (unblocked) servers, sidestepping Yahoo's rate
// limit on the local IP. No API key required.
async function fetchChartViaProxy(symbol: string): Promise<Candle[]> {
  const target = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=2y&interval=1d`;
  const response = await fetch(`https://r.jina.ai/${target}`, {
    headers: { "x-respond-with": "text", "User-Agent": BROWSER_UA }
  });
  if (!response.ok) {
    throw new Error(`Proxy chart ${response.status}`);
  }
  return parseChartPayload(JSON.parse(await response.text()));
}

// Independent fallback when both Yahoo paths fail. Requires a free TWELVE_DATA_API_KEY.
// Maps our "RELIANCE.NS" format to Twelve Data's symbol + exchange params.
async function fetchTwelveData(symbol: string): Promise<Candle[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY not set");
  }

  const ticker = symbol.replace(/\.NS$/, "");
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    ticker
  )}&exchange=NSE&interval=1day&outputsize=250&apikey=${apiKey}`;

  const response = await fetch(url);
  const payload = await response.json();
  if (payload?.status === "error" || !Array.isArray(payload?.values)) {
    throw new Error(`Twelve Data: ${payload?.message ?? "no data"}`);
  }

  // Twelve Data returns newest-first; reverse to chronological order.
  const rows = (payload.values as Array<Record<string, string>>)
    .slice()
    .reverse()
    .map((row) => ({
      date: new Date(row.datetime),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume
    }));

  return toCandles(rows);
}

// Yahoo throttles bursts of requests. Try the library first; on failure retry with
// backoff, fall back to a direct chart fetch, then to Twelve Data if configured.
export async function getDailyCandles(symbol: string, retries = 4): Promise<Candle[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await yahooFinance.chart(symbol, {
        period1: subDays(new Date(), 420),
        interval: "1d"
      });

      return toCandles(
        result.quotes.map((row) => ({
          date: new Date(row.date),
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume
        }))
      );
    } catch (error) {
      lastError = error;

      // On rate limit, try the alternate sources in order: direct fetch, proxy
      // (clean IP), then Twelve Data.
      if (isRateLimited(error)) {
        for (const fallback of [fetchChartDirect, fetchChartViaProxy, fetchTwelveData]) {
          try {
            return await fallback(symbol);
          } catch (fallbackError) {
            lastError = fallbackError;
          }
        }
      }

      if (attempt >= retries) break;
      const base = isRateLimited(error) ? 8000 : 1500;
      const backoff = Math.min(base * 2 ** attempt, 30000);
      const jitter = Math.floor(backoff * 0.25 * ((attempt % 3) / 3 + 0.1));
      await sleep(backoff + jitter);
    }
  }

  // Last resort: try every alternate source before giving up.
  for (const fallback of [fetchChartDirect, fetchChartViaProxy, fetchTwelveData]) {
    try {
      return await fallback(symbol);
    } catch {
      /* try next */
    }
  }
  throw lastError;
}
