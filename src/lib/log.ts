/** Tiny logger for server-side events. */
export function logInfo(event: string, data?: Record<string, unknown>) {
  const line = {
    level: "info",
    event,
    ts: new Date().toISOString(),
    ...(data || {}),
  };
  console.info(JSON.stringify(line));
}

export function logWarn(event: string, data?: Record<string, unknown>) {
  const line = {
    level: "warn",
    event,
    ts: new Date().toISOString(),
    ...(data || {}),
  };
  console.warn(JSON.stringify(line));
}

export function logError(event: string, err?: unknown, data?: Record<string, unknown>) {
  const line = {
    level: "error",
    event,
    ts: new Date().toISOString(),
    err: err instanceof Error ? err.message : err == null ? undefined : String(err),
    ...(data || {}),
  };
  console.error(JSON.stringify(line));
}
