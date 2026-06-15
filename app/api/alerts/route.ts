import { prisma } from "@/lib/db/prisma";
import { json } from "@/lib/server/http";

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
  const alerts = await prisma.alert.findMany({
    include: { stock: true },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200)
  });

  return json(alerts);
}
