import { generateAlerts } from "@/lib/scanners/alerts";
import { scanNews } from "@/lib/scanners/news";
import { json } from "@/lib/server/http";
import { requireScanSecret } from "@/lib/server/time";

export async function POST(request: Request) {
  const unauthorized = requireScanSecret(request);
  if (unauthorized) return unauthorized;

  const news = await scanNews();
  const alerts = await generateAlerts();
  return json({ news: news.length, alerts: alerts.length });
}
