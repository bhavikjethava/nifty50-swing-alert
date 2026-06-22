import { subHours } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { sendEmailAlert } from "@/lib/notifications/email";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

type Signal = "BULLISH" | "BEARISH";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

export function buildAlertMessage(input: {
  symbol: string;
  signal: Signal;
  price: number;
  reasons: string[];
  newsTitle: string;
  sentiment: string;
}): string {
  const icon = input.signal === "BULLISH" ? "🚀" : "⚠️";
  const technicals = input.reasons.map((reason) => `✓ ${reason}`).join("\n");

  return `${icon} NIFTY50 SWING ALERT

Stock: ${input.symbol.replace(".NS", "")}

Signal: ${input.signal}

Price: ${formatPrice(input.price)}

Technicals:
${technicals}

News:
"${input.newsTitle}"

Sentiment: ${input.sentiment}

Action:
Review chart before entering trade. This is informational only and does not place trades.`;
}

export async function generateAlerts() {
  const since = subHours(new Date(), 24);
  const stocks = await prisma.stock.findMany({
    include: {
      news: {
        where: {
          publishedAt: { gte: since },
          sentiment: { in: ["POSITIVE", "NEGATIVE"] }
        },
        orderBy: { publishedAt: "desc" }
      },
      snapshots: {
        orderBy: { scannedAt: "desc" },
        take: 1
      },
      alerts: {
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const created = [];

  for (const stock of stocks) {
    const latestSnapshot = stock.snapshots[0];
    if (!latestSnapshot || stock.alerts.length > 0) {
      continue;
    }

    // Fire on a confirmed technical setup. News is supporting context if a
    // matching-sentiment headline exists, but is no longer required — the strict
    // news AND-gate combined with mostly-neutral sentiment blocked nearly all alerts.
    if (latestSnapshot.trend === "NEUTRAL") {
      continue;
    }

    const signal: Signal = latestSnapshot.trend === "BULLISH" ? "BULLISH" : "BEARISH";
    const matchingNews = stock.news.find((news) => {
      return (
        (signal === "BULLISH" && news.sentiment === "POSITIVE") ||
        (signal === "BEARISH" && news.sentiment === "NEGATIVE")
      );
    });

    const message = buildAlertMessage({
      symbol: stock.symbol,
      signal,
      price: latestSnapshot.price,
      reasons: JSON.parse(latestSnapshot.reasons) as string[],
      newsTitle: matchingNews?.title ?? "No confirming news in the last 24h.",
      sentiment: matchingNews?.sentiment ?? "NONE"
    });

    const alert = await prisma.alert.create({
      data: {
        stockId: stock.id,
        signal,
        price: latestSnapshot.price,
        message
      }
    });

    created.push(alert);
  }

  return created;
}

export async function sendPendingAlerts() {
  const pending = await prisma.alert.findMany({
    where: { sentAt: null },
    include: { stock: true },
    orderBy: { createdAt: "asc" }
  });

  const sent = [];
  for (const alert of pending) {
    const deliveredByTelegram = await sendTelegramMessage(alert.message);
    const deliveredByEmail = deliveredByTelegram
      ? false
      : await sendEmailAlert(`Nifty50 ${alert.signal} alert: ${alert.stock.symbol}`, alert.message);

    if (deliveredByTelegram || deliveredByEmail) {
      sent.push(
        await prisma.alert.update({
          where: { id: alert.id },
          data: { sentAt: new Date() }
        })
      );
    }
  }

  return sent;
}
