import { NextResponse } from "next/server";
import { postService } from "@/modules/posts/post.service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await postService.getById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { content?: string; mediaUrls?: string[]; scheduledAt?: string | null };
  const post = await postService.update(id, {
    ...body,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : body.scheduledAt === null ? null : undefined,
  });
  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await postService.remove(id);
  return new NextResponse(null, { status: 204 });
}
