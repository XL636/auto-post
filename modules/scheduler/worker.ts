import { Worker, Job } from "bullmq";
import { syncAllAnalytics } from "@/modules/analytics/analytics.sync";
import { redis } from "@/shared/lib/redis";
import { publishPost } from "@/modules/posts/publish.service";

export function createPublishWorker() {
  return new Worker(
    "publish-queue",
    async (job: Job<{ postId: string }>) => {
      await publishPost(job.data.postId);
    },
    { connection: redis, concurrency: 5 },
  );
}

export function createAnalyticsSyncWorker() {
  return new Worker(
    "analytics-sync-queue",
    async () => {
      await syncAllAnalytics();
    },
    { connection: redis, concurrency: 1 },
  );
}
