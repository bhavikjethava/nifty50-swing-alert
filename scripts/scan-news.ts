import { generateAlerts } from "../lib/scanners/alerts";
import { scanNews } from "../lib/scanners/news";

async function main() {
  const items = await scanNews();
  const alerts = await generateAlerts();
  console.log(`Stored ${items.length} news records and generated ${alerts.length} alerts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
