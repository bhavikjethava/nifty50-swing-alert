import stocks from "@/data/nifty50.json";
import { prisma } from "@/lib/db/prisma";
import { fetchStockNews } from "@/lib/scanners/rss";

function isLikelyAboutStock(itemTitle: string, stockName: string, symbol: string): boolean {
  const normalized = `${itemTitle} ${stockName} ${symbol}`.toLowerCase();
  const shortSymbol = symbol.replace(".NS", "").toLowerCase();
  return normalized.includes(stockName.toLowerCase().split(" ")[0]) || normalized.includes(shortSymbol);
}

export async function scanNews() {
  const seeded = [];
  for (const stock of stocks) {
    const dbStock = await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      create: stock,
      update: stock
    });

    const items = await fetchStockNews(stock.name);
    for (const item of items) {
      if (!isLikelyAboutStock(item.title, stock.name, stock.symbol)) {
        continue;
      }

      const stored = await prisma.news.upsert({
        where: { url: item.url },
        update: {
          title: item.title,
          source: item.source,
          summary: item.summary,
          sentiment: item.sentiment,
          publishedAt: item.publishedAt
        },
        create: {
          stockId: dbStock.id,
          title: item.title,
          source: item.source,
          url: item.url,
          summary: item.summary,
          sentiment: item.sentiment,
          publishedAt: item.publishedAt
        }
      });
      seeded.push(stored);
    }
  }

  return seeded;
}
