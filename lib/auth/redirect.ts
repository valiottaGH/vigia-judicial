/** Ruta interna segura post-login (evita open redirects). */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

/** Origen de la app segun el request (localhost vs produccion). */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost && process.env.NODE_ENV === "production") {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return url.origin;
}

export function buildAuthCallbackUrl(origin: string, next: string): string {
  const safeNext = safeRedirectPath(next);
  return `${origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
