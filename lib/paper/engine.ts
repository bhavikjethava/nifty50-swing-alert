import { differenceInCalendarDays } from "date-fns";
import { ema, latestFinite } from "@/lib/analysis/indicators";
import { prisma } from "@/lib/db/prisma";
import { getDailyCandles } from "@/lib/scanners/yahoo";

const POSITION_FRACTION = 0.1; // each BUY uses 10% of current cash

// One account row, created lazily with the ₹50k starting capital.
export async function getAccount() {
  const existing = await prisma.paperAccount.findFirst();
  if (existing) return existing;
  return prisma.paperAccount.create({ data: {} });
}

// Open paper positions for stocks whose latest snapshot is BULLISH and that have
// no currently-open position. Sizes each at 10% of available cash.
export async function openPositions() {
  const account = await getAccount();
  let cash = account.cash;
  const opened: string[] = [];

  const signals = await prisma.stock.findMany({
    include: { snapshots: { orderBy: { scannedAt: "desc" }, take: 1 } }
  });

  for (const stock of signals) {
    const snapshot = stock.snapshots[0];
    if (!snapshot || snapshot.trend !== "BULLISH") continue;

    const openPos = await prisma.paperPosition.findFirst({
      where: { symbol: stock.symbol, status: "OPEN" }
    });
    if (openPos) continue;

    const budget = cash * POSITION_FRACTION;
    const quantity = Math.floor(budget / snapshot.price);
    if (quantity < 1) continue;

    const cost = quantity * snapshot.price;
    cash -= cost;

    await prisma.paperPosition.create({
      data: {
        symbol: stock.symbol,
        quantity,
        entryPrice: snapshot.price,
        holdMaxDays: snapshot.holdMaxDays || 10
      }
    });
    opened.push(stock.symbol);
  }

  await prisma.paperAccount.update({ where: { id: account.id }, data: { cash } });
  return opened;
}

// Close open positions per the validated exit: price reclaims EMA20 (bounce done)
// or the suggested hold horizon has elapsed. Realizes P&L back into cash.
export async function closePositions() {
  const account = await getAccount();
  let cash = account.cash;
  const closed: { symbol: string; pnl: number; reason: string }[] = [];

  const positions = await prisma.paperPosition.findMany({ where: { status: "OPEN" } });

  for (const position of positions) {
    let candles;
    try {
      candles = await getDailyCandles(position.symbol);
    } catch {
      continue; // can't price it today; leave open
    }

    const price = candles[candles.length - 1]?.close;
    const ema20 = latestFinite(ema(candles.map((c) => c.close), 20));
    if (price == null || ema20 == null) continue;

    const heldDays = differenceInCalendarDays(new Date(), position.entryDate);
    const reclaimedEma20 = price >= ema20;
    const horizonReached = heldDays >= position.holdMaxDays;

    if (!reclaimedEma20 && !horizonReached) continue;

    const proceeds = position.quantity * price;
    const realizedPnl = proceeds - position.quantity * position.entryPrice;
    cash += proceeds;

    await prisma.paperPosition.update({
      where: { id: position.id },
      data: {
        status: "CLOSED",
        exitPrice: price,
        exitDate: new Date(),
        exitReason: reclaimedEma20 ? "ema20-reclaim" : "horizon",
        realizedPnl
      }
    });
    closed.push({ symbol: position.symbol, pnl: realizedPnl, reason: reclaimedEma20 ? "ema20-reclaim" : "horizon" });
  }

  await prisma.paperAccount.update({ where: { id: account.id }, data: { cash } });
  return closed;
}

export async function runPaperTradingCycle() {
  // Close first (frees cash), then open new positions with it.
  const closed = await closePositions();
  const opened = await openPositions();
  return { closed, opened };
}
