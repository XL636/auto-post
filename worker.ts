import { createPublishWorker } from "./modules/scheduler/worker";

console.log("Starting BullMQ worker...");
const worker = createPublishWorker();

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for post ${job.data.postId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
