import { prisma } from "@/shared/lib/prisma";
import { getAuthorizedPlatformClient } from "@/modules/accounts/account.service";
import type { Post, PostStatus } from "@prisma/client";
import type { CreatePostInput, UpdatePostInput, PostFilters } from "./types";

export const postService = {
  async create(input: CreatePostInput): Promise<Post> {
    const status: PostStatus = input.scheduledAt ? "SCHEDULED" : "DRAFT";

    return prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          content: input.content,
          mediaUrls: input.mediaUrls || [],
          status,
          scheduledAt: input.scheduledAt,
        },
      });

      if (input.platformAccountIds.length > 0) {
        await tx.postPlatform.createMany({
          data: input.platformAccountIds.map((accountId) => ({
            postId: post.id,
            accountId,
            status,
            overrideContent: input.overrides?.[accountId] ?? null,
          })),
        });
      }

      return post;
    });
  },

  async list(filters: PostFilters): Promise<Post[]> {
    return prisma.post.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
      },
      include: {
        platforms: { include: { account: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  },

  async getById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        platforms: {
          include: { account: true, analytics: { orderBy: { fetchedAt: "desc" }, take: 1 } },
        },
      },
    });
  },

  async update(id: string, input: UpdatePostInput): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data: {
        ...(input.content !== undefined && { content: input.content }),
        ...(input.mediaUrls !== undefined && { mediaUrls: input.mediaUrls }),
        ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
      },
    });
  },

  async remove(id: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { platforms: { include: { account: true } } },
    });
    if (post) {
      await Promise.all(
        post.platforms.map(async (pp) => {
          if (!pp.platformPostId || pp.status !== "PUBLISHED") return;
          try {
            const { client } = await getAuthorizedPlatformClient(pp.account);
            await client.deletePost(pp.platformPostId);
          } catch (error) {
            console.error(`Failed to delete from ${pp.account.platform}:`, error);
          }
        }),
      );
    }
    await prisma.post.delete({ where: { id } });
  },

  async getDrafts(): Promise<Post[]> {
    return prisma.post.findMany({
      where: { status: "DRAFT" },
      include: { platforms: { include: { account: true } } },
      orderBy: { updatedAt: "desc" },
    });
  },
};
