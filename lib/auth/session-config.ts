export const SESSION_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60;
export const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
export const SESSION_STARTED_COOKIE = "fc_session_started";

export function applySessionCookieOptions(
  options: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    ...options,
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function isAbsoluteSessionExpired(startedAtMs: number): boolean {
  return Date.now() - startedAtMs > SESSION_COOKIE_MAX_AGE_SECONDS * 1000;
}
