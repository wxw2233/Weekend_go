import { NextResponse } from "next/server";
import { clientIp } from "@/lib/rate-limit";
import { getMyVotes, voterKeyFromIp } from "@/lib/poll";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = clientIp(request);
  const votes = getMyVotes(voterKeyFromIp(ip));
  return NextResponse.json(
    { ok: true, votes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
