import { initAnalyticsSyncSchedule } from "./queue";
import { createPublishWorker, createAnalyticsSyncWorker } from "./worker";

async function main() {
  console.log("Starting workers...");
  createPublishWorker();
  createAnalyticsSyncWorker();
  await initAnalyticsSyncSchedule();
  console.log("Workers started. Publish + Analytics sync (hourly)");
}

main().catch(console.error);
