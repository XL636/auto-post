import { publishQueue } from "./queue";

export const schedulerService = {
  async schedule(postId: string, scheduledAt: Date): Promise<string> {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    const job = await publishQueue.add(
      "publish",
      { postId },
      { delay, jobId: `publish-${postId}` },
    );
    return job.id!;
  },

  async cancel(jobId: string): Promise<void> {
    const job = await publishQueue.getJob(jobId);
    if (job) await job.remove();
  },

  async reschedule(postId: string, newTime: Date): Promise<string> {
    await this.cancel(`publish-${postId}`);
    return this.schedule(postId, newTime);
  },
};
