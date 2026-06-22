import { prisma } from "@/lib/db/prisma";
import { getAccount } from "@/lib/paper/engine";

export async function getPortfolio() {
  const account = await getAccount();

  const [openPositions, closedPositions] = await Promise.all([
    prisma.paperPosition.findMany({ where: { status: "OPEN" }, orderBy: { entryDate: "desc" } }),
    prisma.paperPosition.findMany({ where: { status: "CLOSED" }, orderBy: { exitDate: "desc" } })
  ]);

  // Latest stored price per symbol (from the technicals scan) to mark open positions.
  const symbols = openPositions.map((p) => p.symbol);
  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: symbols } },
    include: { snapshots: { orderBy: { scannedAt: "desc" }, take: 1 } }
  });
  const priceBySymbol = new Map(stocks.map((s) => [s.symbol, s.snapshots[0]?.price ?? null]));

  const holdings = openPositions.map((position) => {
    const lastPrice = priceBySymbol.get(position.symbol) ?? position.entryPrice;
    const marketValue = position.quantity * lastPrice;
    const cost = position.quantity * position.entryPrice;
    const unrealizedPnl = marketValue - cost;
    return {
      ...position,
      lastPrice,
      marketValue,
      cost,
      unrealizedPnl,
      unrealizedPnlPct: cost > 0 ? (unrealizedPnl / cost) * 100 : 0
    };
  });

  const holdingsValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);
  const unrealizedPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
  const equity = account.cash + holdingsValue;

  const wins = closedPositions.filter((p) => (p.realizedPnl ?? 0) > 0).length;

  return {
    account,
    holdings,
    closedPositions,
    summary: {
      startingCapital: account.startingCapital,
      cash: account.cash,
      holdingsValue,
      equity,
      realizedPnl,
      unrealizedPnl,
      totalPnl: equity - account.startingCapital,
      totalPnlPct: ((equity - account.startingCapital) / account.startingCapital) * 100,
      closedTrades: closedPositions.length,
      winRate: closedPositions.length ? (wins / closedPositions.length) * 100 : 0
    }
  };
}
