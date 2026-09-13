const buckets = new Map<string, number[]>();

export type RateResult = {
  ok: boolean;
  retryAfterSec: number;
};

/** Simple in-memory sliding window limiter (single-node). */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateResult {
  const now = Date.now();
  const list = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    const oldest = list[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  list.push(now);
  buckets.set(key, list);
  return { ok: true, retryAfterSec: 0 };
}

/** Peek without recording a hit. */
export function rateLimitPeek(
  key: string,
  limit: number,
  windowMs: number,
): RateResult {
  const now = Date.now();
  const list = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  buckets.set(key, list);
  if (list.length >= limit) {
    const oldest = list[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function rateLimitRecord(key: string) {
  const list = buckets.get(key) || [];
  list.push(Date.now());
  buckets.set(key, list);
}

/** Short cooldown after a failed attempt (does not count toward success quota). */
export function failCooldown(key: string, cooldownMs = 10_000): RateResult {
  const last = buckets.get(key)?.[buckets.get(key)!.length - 1];
  const now = Date.now();
  if (last && now - last < cooldownMs) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((last + cooldownMs - now) / 1000)),
    };
  }
  buckets.set(key, [now]);
  return { ok: true, retryAfterSec: 0 };
}

/** Peek last fail without recording. */
export function failCooldownPeek(key: string, cooldownMs = 10_000): RateResult {
  const list = buckets.get(key) || [];
  const last = list[list.length - 1];
  const now = Date.now();
  if (last && now - last < cooldownMs) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((last + cooldownMs - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Record a failed attempt (starts 10s cooldown). */
export function markFail(key: string) {
  buckets.set(key, [Date.now()]);
}

const TRUST_PROXY = process.env.TRUST_PROXY === "1";

export function clientIp(request: Request): string {
  // Only trust reverse-proxy headers when explicitly enabled.
  if (TRUST_PROXY) {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const parts = xff
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      // Right-most is appended by the trusted proxy; left-most is client-forged.
      if (parts.length) return parts[parts.length - 1]!;
    }
  }
  return request.headers.get("x-real-ip") || "local";
}
