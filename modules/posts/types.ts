import type { PostStatus } from "@prisma/client";

export interface CreatePostInput {
  content: string;
  mediaUrls?: string[];
  platformAccountIds: string[];
  scheduledAt?: Date;
  overrides?: Record<string, string>;
}

export interface UpdatePostInput {
  content?: string;
  mediaUrls?: string[];
  platformAccountIds?: string[];
  scheduledAt?: Date | null;
  overrides?: Record<string, string>;
}

export interface PostFilters {
  status?: PostStatus;
  limit?: number;
  offset?: number;
}
