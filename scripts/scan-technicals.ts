import { generateAlerts } from "../lib/scanners/alerts";
import { scanTechnicals } from "../lib/scanners/technicals";

async function main() {
  const snapshots = await scanTechnicals();
  const alerts = await generateAlerts();
  console.log(`Stored ${snapshots.length} technical snapshots and generated ${alerts.length} alerts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
