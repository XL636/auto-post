import { NextResponse } from "next/server";
import { publishPost } from "@/modules/posts/publish.service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await publishPost(id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.results[0]?.error || "Failed to publish post",
          results: result.results,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
