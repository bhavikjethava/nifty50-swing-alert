import { subHours } from "date-fns";
import { prisma } from "@/lib/db/prisma";

export async function getDashboardData() {
  const since24h = subHours(new Date(), 24);
  const [stocks, activeAlerts, latestNews, latestAlerts, sentiments] = await Promise.all([
    prisma.stock.findMany({
      include: {
        news: { orderBy: { publishedAt: "desc" }, take: 1 },
        snapshots: { orderBy: { scannedAt: "desc" }, take: 1 },
        alerts: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { symbol: "asc" }
    }),
    prisma.alert.count({ where: { createdAt: { gte: since24h } } }),
    prisma.news.findMany({
      include: { stock: true },
      orderBy: { publishedAt: "desc" },
      take: 8
    }),
    prisma.alert.findMany({
      include: { stock: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.news.groupBy({
      by: ["sentiment"],
      _count: true,
      where: { publishedAt: { gte: since24h } }
    })
  ]);

  return {
    totalStocks: stocks.length,
    activeAlerts,
    latestNews,
    latestAlerts,
    sentiments,
    watchlist: stocks.map((stock) => ({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      latestNews: stock.news[0] ?? null,
      latestSnapshot: stock.snapshots[0] ?? null,
      latestAlert: stock.alerts[0] ?? null
    }))
  };
}
