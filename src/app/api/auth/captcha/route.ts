import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`captcha:${clientIp(request)}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${limited.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  const { token, dataUrl } = createCaptcha();
  return NextResponse.json({ token, dataUrl });
}
