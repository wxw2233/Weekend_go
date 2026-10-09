import { NextResponse } from "next/server";
import { getMyVotes } from "@/lib/poll";
import { getRequestUser } from "@/lib/user-auth-http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  const votes = user ? getMyVotes(`u:${user.id}`) : {};
  return NextResponse.json(
    { ok: true, votes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
