import { json } from "@/lib/server/http";
import { getSignals } from "@/lib/server/signals";

export async function GET() {
  const signals = await getSignals();
  return json(signals);
}
