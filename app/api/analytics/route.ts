import { NextResponse } from "next/server";
import { analyticsService } from "@/modules/analytics/analytics.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const data = await analyticsService.getOverview(days);
  return NextResponse.json(data);
}
