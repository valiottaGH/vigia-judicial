import { createHmac, timingSafeEqual } from "crypto";

export class InvalidWebhookSignatureError extends Error {
  constructor(message = "Firma de webhook inválida") {
    super(message);
    this.name = "InvalidWebhookSignatureError";
  }
}

function parseXSignature(header: string | null): { ts: string | null; v1: string | null } {
  if (!header) return { ts: null, v1: null };

  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2).map((s) => s.trim());
    if (key === "ts") ts = value ?? null;
    if (key === "v1") v1 = value ?? null;
  }

  return { ts, v1 };
}

function buildManifest(input: {
  dataId?: string | null;
  xRequestId?: string | null;
  ts?: string | null;
}): string {
  const parts: string[] = [];
  if (input.dataId) {
    parts.push(`id:${input.dataId.toLowerCase()};`);
  }
  if (input.xRequestId) {
    parts.push(`request-id:${input.xRequestId};`);
  }
  if (input.ts) {
    parts.push(`ts:${input.ts};`);
  }
  return parts.join("");
}

export function getMercadoPagoWebhookSecret(): string | null {
  return process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || null;
}

/**
 * Valida la firma HMAC de notificaciones IPN de Mercado Pago.
 * @see https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 */
export function validateMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId?: string | null;
  secret: string;
  maxAgeSeconds?: number;
}): void {
  const { ts, v1 } = parseXSignature(input.xSignature);

  if (!v1) {
    throw new InvalidWebhookSignatureError("Header x-signature sin v1");
  }

  if (input.maxAgeSeconds && ts) {
    const ageMs = Date.now() - Number(ts) * 1000;
    if (Number.isFinite(ageMs) && ageMs > input.maxAgeSeconds * 1000) {
      throw new InvalidWebhookSignatureError("Notificación expirada");
    }
  }

  const manifest = buildManifest({
    dataId: input.dataId,
    xRequestId: input.xRequestId,
    ts,
  });

  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new InvalidWebhookSignatureError();
  }
}
