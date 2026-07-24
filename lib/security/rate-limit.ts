import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export interface RateLimitConfig {
  /** Identificador único del bucket, ej. `check-email:1.2.3.4` */
  key: string;
  /** Máximo de requests permitidos en la ventana */
  limit: number;
  /** Duración de la ventana en segundos */
  windowSeconds: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitKey(route: string, request: Request, suffix?: string): string {
  const ip = extractClientIp(request);
  return suffix ? `${route}:${ip}:${suffix}` : `${route}:${ip}`;
}

/** Rate limit persistente vía Supabase (funciona en serverless multi-instancia). */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const admin = createServiceClient();
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const { data: row } = await admin
    .from("api_rate_limits")
    .select("hits, window_start")
    .eq("bucket_key", config.key)
    .maybeSingle();

  const existing = row as { hits: number; window_start: string } | null;

  if (!existing) {
    await admin.from("api_rate_limits").insert({
      bucket_key: config.key,
      hits: 1,
      window_start: new Date(now).toISOString(),
    } as never);
    return { ok: true, remaining: config.limit - 1 };
  }

  const windowStart = new Date(existing.window_start).getTime();
  const elapsed = now - windowStart;

  if (elapsed >= windowMs) {
    await admin
      .from("api_rate_limits")
      .update({
        hits: 1,
        window_start: new Date(now).toISOString(),
      } as never)
      .eq("bucket_key", config.key);
    return { ok: true, remaining: config.limit - 1 };
  }

  if (existing.hits >= config.limit) {
    const retryAfterSeconds = Math.ceil((windowMs - elapsed) / 1000);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  await admin
    .from("api_rate_limits")
    .update({ hits: existing.hits + 1 } as never)
    .eq("bucket_key", config.key);

  return { ok: true, remaining: config.limit - existing.hits - 1 };
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "Demasiados intentos. Probá de nuevo en unos minutos.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
