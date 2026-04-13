import { NextResponse } from "next/server";
import { postService } from "@/modules/posts/post.service";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { action, ids } = body ?? {};

  if (
    (action !== "delete" && action !== "publish") ||
    !Array.isArray(ids) || ids.length === 0 ||
    ids.some((id: unknown) => typeof id !== "string" || !id)
  ) {
    return NextResponse.json({ error: "Invalid bulk request" }, { status: 400 });
  }

  if (action === "delete") {
    const results = await Promise.allSettled(ids.map((id: string) => postService.remove(id)));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ succeeded, total: ids.length });
  }

  const [{ publishQueue }, { prisma }] = await Promise.all([
    import("@/modules/scheduler/queue"),
    import("@/shared/lib/prisma"),
  ]);

  let succeeded = 0;
  for (const id of ids) {
    const post = await prisma.post.findUnique({ where: { id }, select: { id: true, status: true } });
    if (post && post.status === "DRAFT") {
      await prisma.post.update({ where: { id }, data: { status: "SCHEDULED" } });
      await publishQueue.add("publish", { postId: id });
      succeeded++;
    }
  }
  return NextResponse.json({ succeeded, total: ids.length });
}
