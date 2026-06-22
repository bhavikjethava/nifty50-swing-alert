import { prisma } from "@/lib/db/prisma";

export async function getBacktestData() {
  const rows = await prisma.backtest.findMany({ orderBy: { winRate: "desc" } });

  const withTrades = rows.filter((row) => row.trades > 0);
  const totalTrades = withTrades.reduce((sum, row) => sum + row.trades, 0);
  const totalWins = withTrades.reduce((sum, row) => sum + row.wins, 0);
  const sumReturn = withTrades.reduce((sum, row) => sum + row.totalReturnPct, 0);
  const avgVsBuyHold = withTrades.length
    ? withTrades.reduce((sum, row) => sum + (row.totalReturnPct - row.buyHoldReturnPct), 0) / withTrades.length
    : 0;

  return {
    rows,
    ranAt: rows[0]?.ranAt ?? null,
    summary: {
      symbols: withTrades.length,
      totalTrades,
      overallWinRate: totalTrades ? (totalWins / totalTrades) * 100 : 0,
      avgReturnPerTrade: totalTrades ? sumReturn / totalTrades : 0,
      avgVsBuyHold
    }
  };
}
