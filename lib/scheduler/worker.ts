import cron from "node-cron";
import { generateAlerts, sendPendingAlerts } from "@/lib/scanners/alerts";
import { scanNews } from "@/lib/scanners/news";
import { scanTechnicals } from "@/lib/scanners/technicals";
import { isIndianMarketHours } from "@/lib/server/time";

let runningNews = false;
let runningTechnicals = false;

export function startWorker() {
  cron.schedule("*/15 * * * *", async () => {
    if (runningNews) return;
    runningNews = true;
    try {
      await scanNews();
      await generateAlerts();
      await sendPendingAlerts();
    } finally {
      runningNews = false;
    }
  });

  cron.schedule("*/30 * * * *", async () => {
    if (!isIndianMarketHours() || runningTechnicals) return;
    runningTechnicals = true;
    try {
      await scanTechnicals();
      await generateAlerts();
      await sendPendingAlerts();
    } finally {
      runningTechnicals = false;
    }
  });

  console.log("Nifty50 Swing Alert worker started.");
}
