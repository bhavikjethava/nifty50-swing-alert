import stocks from "../data/nifty50.json";
import { aggregateBacktests, backtestSymbol, type BacktestResult } from "../lib/analysis/backtest";
import { prisma } from "../lib/db/prisma";
import { getDailyCandles } from "../lib/scanners/yahoo";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const results: BacktestResult[] = [];

  for (const stock of stocks) {
    try {
      const candles = await getDailyCandles(stock.symbol);
      const result = backtestSymbol(stock.symbol, candles);
      if (result) {
        results.push(result);
        await prisma.backtest.upsert({
          where: { symbol: result.symbol },
          create: { ...result, ranAt: new Date() },
          update: { ...result, ranAt: new Date() }
        });
      }
    } catch (error) {
      console.error(`Backtest skipped ${stock.symbol}:`, error instanceof Error ? error.message : error);
    }
    await sleep(1500);
  }

  const summary = aggregateBacktests(results);
  console.log("\n=== Backtest summary (250-day history) ===");
  console.log(`Symbols with trades: ${summary.symbols}`);
  console.log(`Total trades:        ${summary.totalTrades}`);
  console.log(`Overall win rate:    ${summary.overallWinRate.toFixed(1)}%`);
  console.log(`Avg return/trade:    ${summary.avgReturnPerTrade.toFixed(2)}%`);
  console.log(`Avg vs buy-and-hold: ${summary.avgVsBuyHold.toFixed(2)}% per symbol`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
