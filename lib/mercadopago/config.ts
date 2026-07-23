export function isMercadoPagoConfigured(): boolean {
  return Boolean(
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() &&
      process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim()
  );
}

export function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
  }
  return token;
}

export function getMercadoPagoPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim();
  if (!key) {
    throw new Error("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no configurado");
  }
  return key;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** HTTPS public URL (not localhost) — required for MP back_urls / auto_return / webhook. */
export function isPublicHttpsAppUrl(baseUrl?: string): boolean {
  const url = (baseUrl ?? getAppBaseUrl()).trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

export function formatMercadoPagoError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const payload = err as { message?: string; error?: string };
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
  }
  return "Error de Mercado Pago";
}
