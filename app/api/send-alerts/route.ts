import { sendPendingAlerts } from "@/lib/scanners/alerts";
import { json } from "@/lib/server/http";
import { requireScanSecret } from "@/lib/server/time";

export async function POST(request: Request) {
  const unauthorized = requireScanSecret(request);
  if (unauthorized) return unauthorized;

  const sent = await sendPendingAlerts();
  return json({ sent: sent.length });
}
