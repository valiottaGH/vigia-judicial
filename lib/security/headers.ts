import type { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/** Headers de seguridad aplicados a todas las respuestas. */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // CSP permisiva para Mercado Pago Bricks + Supabase; ajustar si se agregan más integraciones.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com",
      "style-src 'self' 'unsafe-inline' https://sdk.mercadopago.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://openrouter.ai https://api.openai.com",
      "frame-src https://sdk.mercadopago.com https://www.mercadopago.com https://www.mercadolibre.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}
