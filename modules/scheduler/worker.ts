import { Worker, Job } from "bullmq";
import { redis } from "@/shared/lib/redis";
import { prisma } from "@/shared/lib/prisma";
import { getPlatformClient } from "@/modules/platforms/registry";

export function createPublishWorker() {
  return new Worker(
    "publish-queue",
    async (job: Job<{ postId: string }>) => {
      const { postId } = job.data;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { platforms: { include: { account: true } } },
      });

      if (!post) throw new Error(`Post ${postId} not found`);

      await prisma.post.update({
        where: { id: postId },
        data: { status: "PUBLISHING" },
      });

      const results = await Promise.allSettled(
        post.platforms.map(async (pp) => {
          const content = pp.overrideContent || post.content;
          const client = getPlatformClient(pp.account.platform, pp.account);
          const result = await client.publish(content, post.mediaUrls);

          await prisma.postPlatform.update({
            where: { id: pp.id },
            data: {
              status: result.success ? "PUBLISHED" : "FAILED",
              platformPostId: result.platformPostId,
              errorMessage: result.error,
              publishedAt: result.success ? new Date() : null,
            },
          });

          return result;
        }),
      );

      const allSucceeded = results.every(
        (r) => r.status === "fulfilled" && r.value.success,
      );
      const anySucceeded = results.some(
        (r) => r.status === "fulfilled" && r.value.success,
      );

      await prisma.post.update({
        where: { id: postId },
        data: {
          status: allSucceeded ? "PUBLISHED" : anySucceeded ? "PUBLISHED" : "FAILED",
          publishedAt: anySucceeded ? new Date() : null,
        },
      });
    },
    { connection: redis, concurrency: 5 },
  );
}
