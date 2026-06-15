import { generateAlerts } from "@/lib/scanners/alerts";
import { scanTechnicals } from "@/lib/scanners/technicals";
import { json } from "@/lib/server/http";
import { requireScanSecret } from "@/lib/server/time";

export async function POST(request: Request) {
  const unauthorized = requireScanSecret(request);
  if (unauthorized) return unauthorized;

  const snapshots = await scanTechnicals();
  const alerts = await generateAlerts();
  return json({ snapshots: snapshots.length, alerts: alerts.length });
}
