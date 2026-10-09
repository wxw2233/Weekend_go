import { NextResponse } from "next/server";
import { getPollStats } from "@/lib/poll";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPollStats());
}
