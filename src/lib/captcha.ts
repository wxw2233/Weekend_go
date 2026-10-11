import { randomBytes, timingSafeEqual } from "crypto";

const CODE_LEN = 4;
const TTL_MS = 5 * 60 * 1000;
// hard cap so captcha floods cannot grow the store unbounded
const MAX_PENDING = 10_000;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// token is a random id; the answer never leaves the server
const pending = new Map<string, { code: string; exp: number }>();

function pruneExpired(now: number) {
  for (const [token, rec] of pending) {
    if (rec.exp <= now) pending.delete(token);
  }
}

function randomCode(len = CODE_LEN): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/** Single-use: the token is consumed whether the answer is right or wrong. */
export function verifyCaptcha(
  token: string | null | undefined,
  input: string | null | undefined,
): boolean {
  if (!token || !input) return false;
  const rec = pending.get(token);
  pending.delete(token);
  if (!rec || rec.exp <= Date.now()) return false;
  const raw = input.trim().toUpperCase();
  if (raw.length !== rec.code.length) return false;
  const a = Buffer.from(rec.code, "utf8");
  const b = Buffer.from(raw, "utf8");
  return timingSafeEqual(a, b);
}

export function generateCaptchaSvg(code: string): string {
  const w = 140;
  const h = 48;
  const chars = code.split("");
  const cells = chars.map((ch, i) => {
    const x = 22 + i * 26;
    const y = 30 + (i % 2 === 0 ? -3 : 3);
    const rot = ((i * 17) % 30) - 15;
    const hue = 120 + ((i * 40) % 80);
    return `<text x="${x}" y="${y}" fill="hsl(${hue} 35% 28%)" font-size="26" font-family="Georgia, serif" font-weight="700" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
  });
  const lines = Array.from({ length: 5 }, (_, i) => {
    const y1 = 6 + i * 9;
    const y2 = 42 - i * 7;
    return `<path d="M4 ${y1} Q ${30 + i * 20} ${y2} ${w - 4} ${8 + i * 8}" fill="none" stroke="#1f6b4a" stroke-opacity="${0.15 + i * 0.05}" stroke-width="1"/>`;
  }).join("");
  const dots = Array.from({ length: 18 }, (_, i) => {
    const cx = (i * 37) % w;
    const cy = (i * 17) % h;
    return `<circle cx="${cx}" cy="${cy}" r="1.2" fill="#14201a" fill-opacity="0.2"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="验证码">
  <rect width="${w}" height="${h}" rx="6" fill="#F3F0E8"/>
  ${lines}
  ${dots}
  ${cells.join("")}
</svg>`;
}

export function createCaptcha(): { token: string; dataUrl: string } {
  const now = Date.now();
  if (pending.size >= MAX_PENDING) pruneExpired(now);
  const code = randomCode();
  const token = randomBytes(16).toString("base64url");
  pending.set(token, { code, exp: now + TTL_MS });
  const svg = generateCaptchaSvg(code);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
  return {
    token,
    dataUrl,
  };
}
