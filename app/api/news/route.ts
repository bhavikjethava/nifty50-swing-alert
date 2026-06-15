import { prisma } from "@/lib/db/prisma";
import { json } from "@/lib/server/http";

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
  const news = await prisma.news.findMany({
    include: { stock: true },
    orderBy: { publishedAt: "desc" },
    take: Math.min(limit, 200)
  });

  return json(news);
}
