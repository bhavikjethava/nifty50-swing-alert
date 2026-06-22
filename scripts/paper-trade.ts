import { runPaperTradingCycle } from "../lib/paper/engine";
import { getPortfolio } from "../lib/paper/portfolio";
import { prisma } from "../lib/db/prisma";

async function main() {
  const { closed, opened } = await runPaperTradingCycle();
  console.log(`Closed ${closed.length}:`, closed.map((c) => `${c.symbol} (${c.pnl.toFixed(0)})`).join(", ") || "none");
  console.log(`Opened ${opened.length}:`, opened.join(", ") || "none");

  const { summary } = await getPortfolio();
  console.log(`\nEquity: ₹${summary.equity.toFixed(0)} (start ₹${summary.startingCapital})`);
  console.log(`Total P&L: ₹${summary.totalPnl.toFixed(0)} (${summary.totalPnlPct.toFixed(2)}%)`);
  console.log(`Cash ₹${summary.cash.toFixed(0)} | Holdings ₹${summary.holdingsValue.toFixed(0)} | Closed trades ${summary.closedTrades}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
