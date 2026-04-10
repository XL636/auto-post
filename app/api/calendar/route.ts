import { NextResponse } from "next/server";
import { calendarService } from "@/modules/calendar/calendar.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const data = await calendarService.getMonthView(year, month);
  return NextResponse.json(data);
}
