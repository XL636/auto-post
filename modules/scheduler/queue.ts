import { Queue } from "bullmq";
import { redis } from "@/shared/lib/redis";

export const publishQueue = new Queue("publish-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const analyticsSyncQueue = new Queue("analytics-sync-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 100 },
  },
});

export async function initAnalyticsSyncSchedule() {
  await analyticsSyncQueue.add("sync-analytics", {}, { repeat: { every: 60 * 60 * 1000 } });
}
