import { subHours } from "date-fns";
import { prisma } from "@/lib/db/prisma";

export type SignalVerdict = "BUY" | "SELL" | "HOLD";

export type StockSignal = {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  verdict: SignalVerdict;
  price: number | null;
  trend: string | null;
  sentiment: string | null;
  newsTitle: string | null;
  reasons: string[];
  scannedAt: Date | null;
};

// Strict rule (matches the alert engine): BUY needs a bullish technical setup AND
// positive news in the last 24h; SELL needs a bearish setup AND negative news.
// Everything else is HOLD.
function decide(trend: string | null, sentiment: string | null): SignalVerdict {
  if (trend === "BULLISH" && sentiment === "POSITIVE") return "BUY";
  if (trend === "BEARISH" && sentiment === "NEGATIVE") return "SELL";
  return "HOLD";
}

function explain(verdict: SignalVerdict, trend: string | null, sentiment: string | null): string[] {
  if (!trend) return ["No technical snapshot yet — run the technicals scan."];

  const reasons: string[] = [`Technical trend: ${trend}`];
  reasons.push(sentiment ? `News sentiment (24h): ${sentiment}` : "No qualifying news in last 24h");

  if (verdict === "BUY") reasons.push("Bullish setup confirmed by positive news");
  else if (verdict === "SELL") reasons.push("Bearish setup confirmed by negative news");
  else if (trend === "BULLISH") reasons.push("Bullish setup, but no positive news to confirm");
  else if (trend === "BEARISH") reasons.push("Bearish setup, but no negative news to confirm");
  else reasons.push("No clear directional setup");

  return reasons;
}

export async function getSignals(): Promise<StockSignal[]> {
  const since = subHours(new Date(), 24);
  const stocks = await prisma.stock.findMany({
    include: {
      snapshots: { orderBy: { scannedAt: "desc" }, take: 1 },
      news: {
        where: { publishedAt: { gte: since }, sentiment: { in: ["POSITIVE", "NEGATIVE"] } },
        orderBy: { publishedAt: "desc" },
        take: 1
      }
    },
    orderBy: { symbol: "asc" }
  });

  const signals = stocks.map((stock) => {
    const snapshot = stock.snapshots[0] ?? null;
    const news = stock.news[0] ?? null;
    const trend = snapshot?.trend ?? null;
    const sentiment = news?.sentiment ?? null;
    const verdict = decide(trend, sentiment);

    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      verdict,
      price: snapshot?.price ?? null,
      trend,
      sentiment,
      newsTitle: news?.title ?? null,
      reasons: explain(verdict, trend, sentiment),
      scannedAt: snapshot?.scannedAt ?? null
    };
  });

  // Actionable signals (BUY/SELL) first, then HOLD.
  const rank = { BUY: 0, SELL: 1, HOLD: 2 } as const;
  return signals.sort((a, b) => rank[a.verdict] - rank[b.verdict] || a.symbol.localeCompare(b.symbol));
}
