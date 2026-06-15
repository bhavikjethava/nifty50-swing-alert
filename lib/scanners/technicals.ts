import stocks from "@/data/nifty50.json";
import { evaluateTechnicals } from "@/lib/analysis/technicals";
import { prisma } from "@/lib/db/prisma";
import { getDailyCandles } from "@/lib/scanners/yahoo";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function scanTechnicals() {
  const snapshots = [];

  for (const stock of stocks) {
    const dbStock = await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      create: stock,
      update: stock
    });

    try {
      const candles = await getDailyCandles(stock.symbol);
      const evaluation = evaluateTechnicals(candles);
      const snapshot = await prisma.technicalSnapshot.create({
        data: {
          stockId: dbStock.id,
          price: evaluation.price,
          volume: evaluation.volume,
          ema20: evaluation.ema20,
          ema50: evaluation.ema50,
          ema200: evaluation.ema200,
          avgVolume20: evaluation.avgVolume20,
          trend: evaluation.signal,
          reasons: JSON.stringify(evaluation.reasons)
        }
      });

      snapshots.push(snapshot);
    } catch (error) {
      console.error(`Skipped ${stock.symbol}:`, error instanceof Error ? error.message : error);
    }

    // Space out requests to avoid Yahoo rate limiting.
    await sleep(1500);
  }

  return snapshots;
}
