import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { getAuthorizedPlatformClient, markAccountError, markAccountValidated } from "@/modules/accounts/account.service";
import { getPlatformConfig } from "@/modules/platforms";
import { toErrorMessage } from "@/shared/lib/error";
import type { CreatePostInput } from "./types";

const MEDIA_NOT_IMPLEMENTED_PLATFORMS = new Set([
  "LINKEDIN",
  "FACEBOOK",
  "DISCORD",
  "REDDIT",
  "TWITTER",
]);

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

type PostWithPlatforms = Prisma.PostGetPayload<{
  include: { platforms: { include: { account: true } } };
}>;

export interface PublishPlatformResult {
  postPlatformId: string;
  accountId: string;
  platform: string;
  success: boolean;
  platformPostId?: string;
  error?: string;
}

export interface PublishPostResult {
  postId: string;
  success: boolean;
  postStatus: "PUBLISHED" | "FAILED";
  results: PublishPlatformResult[];
}

export interface PublishValidationIssue {
  accountId: string;
  platform: string;
  message: string;
}

interface MaybePublishValidationIssue {
  accountId: string;
  platform: string;
  message: string | null;
}

function getMediaCounts(mediaUrls: string[]) {
  return mediaUrls.reduce(
    (counts, url) => {
      const normalized = url.toLowerCase();
      if (IMAGE_EXTENSIONS.some((extension) => normalized.endsWith(extension))) {
        counts.images += 1;
      } else if (VIDEO_EXTENSIONS.some((extension) => normalized.endsWith(extension))) {
        counts.videos += 1;
      } else {
        counts.unknown += 1;
      }
      return counts;
    },
    { images: 0, videos: 0, unknown: 0 },
  );
}

export function validatePlatformPublishability(
  content: string,
  mediaUrls: string[],
  account: PostWithPlatforms["platforms"][number]["account"],
): string | null {
  const trimmedContent = content.trim();
  const config = getPlatformConfig(account.platform);
  const counts = getMediaCounts(mediaUrls);

  if (!trimmedContent) {
    return "Content cannot be empty.";
  }

  if (trimmedContent.length > config.maxChars) {
    return `${config.name} supports up to ${config.maxChars} characters.`;
  }

  if (config.requiresMedia && mediaUrls.length === 0) {
    return `${config.name} requires media for publishing.`;
  }

  if (counts.images > config.maxImages) {
    return `${config.name} supports up to ${config.maxImages} images.`;
  }

  if (counts.videos > config.maxVideos) {
    return `${config.name} supports up to ${config.maxVideos} videos.`;
  }

  if (counts.unknown > 0) {
    return `Some media files use an unsupported format for ${config.name}.`;
  }

  if (mediaUrls.length > 0 && MEDIA_NOT_IMPLEMENTED_PLATFORMS.has(account.platform)) {
    return `${config.name} media publishing is not implemented yet.`;
  }

  return null;
}

async function loadPostOrThrow(postId: string): Promise<PostWithPlatforms> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { platforms: { include: { account: true } } },
  });

  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }

  return post;
}

export async function validatePostAccountsInput(input: CreatePostInput): Promise<PublishValidationIssue[]> {
  const accounts = await prisma.account.findMany({
    where: { id: { in: input.platformAccountIds } },
  });

  return accounts
    .map((account): MaybePublishValidationIssue => ({
      accountId: account.id,
      platform: account.platform,
      message: validatePlatformPublishability(input.content, input.mediaUrls || [], account),
    }))
    .filter((issue): issue is PublishValidationIssue => issue.message !== null);
}

export async function publishPost(postId: string): Promise<PublishPostResult> {
  const post = await loadPostOrThrow(postId);

  if (post.platforms.length === 0) {
    await prisma.post.update({
      where: { id: postId },
      data: { status: "FAILED", publishedAt: null },
    });

    return {
      postId,
      success: false,
      postStatus: "FAILED",
      results: [],
    };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: "PUBLISHING" },
  });

  const results = await Promise.all(
    post.platforms.map(async (platformPost): Promise<PublishPlatformResult> => {
      const content = platformPost.overrideContent || post.content;
      const validationError = validatePlatformPublishability(
        content,
        post.mediaUrls,
        platformPost.account,
      );

      if (validationError) {
        await prisma.postPlatform.update({
          where: { id: platformPost.id },
          data: {
            status: "FAILED",
            errorMessage: validationError,
            platformPostId: null,
            publishedAt: null,
          },
        });

        return {
          postPlatformId: platformPost.id,
          accountId: platformPost.accountId,
          platform: platformPost.account.platform,
          success: false,
          error: validationError,
        };
      }

      try {
        const { client } = await getAuthorizedPlatformClient(platformPost.account);
        const result = await client.publish(content, post.mediaUrls);

        await prisma.postPlatform.update({
          where: { id: platformPost.id },
          data: {
            status: result.success ? "PUBLISHED" : "FAILED",
            platformPostId: result.success ? result.platformPostId : null,
            errorMessage: result.error || null,
            publishedAt: result.success ? new Date() : null,
          },
        });

        if (result.success) {
          await markAccountValidated(platformPost.account.id);
        } else if (result.error) {
          await markAccountError(platformPost.account.id, result.error);
        }

        return {
          postPlatformId: platformPost.id,
          accountId: platformPost.accountId,
          platform: platformPost.account.platform,
          success: result.success,
          platformPostId: result.platformPostId,
          error: result.error,
        };
      } catch (error) {
        const message = toErrorMessage(error, `Failed to publish to ${platformPost.account.platform}`);

        await prisma.postPlatform.update({
          where: { id: platformPost.id },
          data: {
            status: "FAILED",
            platformPostId: null,
            errorMessage: message,
            publishedAt: null,
          },
        });
        await markAccountError(platformPost.account.id, message);

        return {
          postPlatformId: platformPost.id,
          accountId: platformPost.accountId,
          platform: platformPost.account.platform,
          success: false,
          error: message,
        };
      }
    }),
  );

  const anySuccess = results.some((result) => result.success);
  const postStatus = anySuccess ? "PUBLISHED" : "FAILED";

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: postStatus,
      publishedAt: anySuccess ? new Date() : null,
    },
  });

  return {
    postId,
    success: anySuccess,
    postStatus,
    results,
  };
}
