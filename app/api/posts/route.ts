import { NextResponse } from "next/server";
import { postService } from "@/modules/posts/post.service";
import { schedulerService } from "@/modules/scheduler/scheduler.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const posts = await postService.list({ status: status || undefined });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const post = await postService.create(body);

  if (body.scheduledAt) {
    await schedulerService.schedule(post.id, new Date(body.scheduledAt));
  }

  return NextResponse.json(post, { status: 201 });
}
