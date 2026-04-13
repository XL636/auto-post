import { NextResponse } from "next/server";
import type { PostStatus } from "@prisma/client";
import { postService } from "@/modules/posts/post.service";
import { validatePostAccountsInput } from "@/modules/posts/publish.service";
import { schedulerService } from "@/modules/scheduler/scheduler.service";
import type { CreatePostInput } from "@/modules/posts/types";

const POST_STATUSES: PostStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"];

function parseStatus(value: string | null): PostStatus | undefined {
  if (!value) {
    return undefined;
  }

  return POST_STATUSES.includes(value as PostStatus) ? (value as PostStatus) : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const posts = await postService.list({ status: parseStatus(searchParams.get("status")) });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const body = (await req.json()) as CreatePostInput & { scheduledAt?: string | Date };
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
  const input: CreatePostInput = {
    ...body,
    scheduledAt,
  };

  if (scheduledAt) {
    const issues = await validatePostAccountsInput(input);
    if (issues.length > 0) {
      return NextResponse.json(
        {
          error: issues[0]?.message || "Scheduled post is not publishable",
          issues,
        },
        { status: 400 },
      );
    }
  }

  const post = await postService.create(input);

  if (scheduledAt) {
    await schedulerService.schedule(post.id, scheduledAt);
  }

  return NextResponse.json(post, { status: 201 });
}
