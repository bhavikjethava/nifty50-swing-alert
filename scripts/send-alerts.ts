import { sendPendingAlerts } from "../lib/scanners/alerts";

async function main() {
  const sent = await sendPendingAlerts();
  console.log(`Sent ${sent.length} pending alerts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
