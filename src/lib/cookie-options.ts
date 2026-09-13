/** Shared cookie flags for session cookies. */
export function sessionCookieOptions(maxAge: number) {
  // Secure is on in production by default. Set COOKIE_SECURE=0 for local HTTP
  // `next start` testing (browsers/clients drop Secure cookies over http).
  const secure =
    process.env.NODE_ENV === "production" &&
    process.env.COOKIE_SECURE !== "0";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure,
  };
}
