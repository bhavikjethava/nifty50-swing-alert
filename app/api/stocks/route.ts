import { json } from "@/lib/server/http";
import { getDashboardData } from "@/lib/server/dashboard";

export async function GET() {
  const data = await getDashboardData();
  return json(data.watchlist);
}
