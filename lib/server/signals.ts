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
  holdMinDays: number;
  holdMaxDays: number;
  holdConfidence: string;
  exitRule: string;
};

// Matches the alert engine: BUY on a bullish technical setup, SELL on bearish,
// HOLD when neutral. Matching-sentiment news raises confidence but is not required.
function decide(trend: string | null): SignalVerdict {
  if (trend === "BULLISH") return "BUY";
  if (trend === "BEARISH") return "SELL";
  return "HOLD";
}

function explain(verdict: SignalVerdict, trend: string | null, sentiment: string | null): string[] {
  if (!trend) return ["No technical snapshot yet — run the technicals scan."];

  const reasons: string[] = [`Technical trend: ${trend}`];
  const confirmed =
    (verdict === "BUY" && sentiment === "POSITIVE") || (verdict === "SELL" && sentiment === "NEGATIVE");

  reasons.push(sentiment ? `News sentiment (24h): ${sentiment}` : "No qualifying news in last 24h");

  if (verdict === "BUY") {
    reasons.push(confirmed ? "Bullish setup confirmed by positive news (high conviction)" : "Bullish setup (no confirming news)");
  } else if (verdict === "SELL") {
    reasons.push(confirmed ? "Bearish setup confirmed by negative news (high conviction)" : "Bearish setup (no confirming news)");
  } else {
    reasons.push("No clear directional setup");
  }

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
    const verdict = decide(trend);

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
      scannedAt: snapshot?.scannedAt ?? null,
      holdMinDays: snapshot?.holdMinDays ?? 0,
      holdMaxDays: snapshot?.holdMaxDays ?? 0,
      holdConfidence: snapshot?.holdConfidence ?? "LOW",
      exitRule: snapshot?.exitRule ?? ""
    };
  });

  // Actionable signals (BUY/SELL) first, then HOLD.
  const rank = { BUY: 0, SELL: 1, HOLD: 2 } as const;
  return signals.sort((a, b) => rank[a.verdict] - rank[b.verdict] || a.symbol.localeCompare(b.symbol));
}
