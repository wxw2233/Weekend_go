import { NextResponse } from "next/server";
import { filterCompanies, listCompanies } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = await listCompanies();
  const filtered = filterCompanies(all, {
    q: searchParams.get("q") || undefined,
    rest: searchParams.get("rest") || undefined,
    city: searchParams.get("city") || undefined,
    source: searchParams.get("source") || undefined,
  });
  return NextResponse.json({ total: all.length, items: filtered });
}
