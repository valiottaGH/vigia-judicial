import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { createServiceClient } from "@/lib/supabase/admin";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import { fulfillMercadoPagoPayment } from "@/lib/mercadopago/fulfill-payment";
import {
  getMercadoPagoWebhookSecret,
  InvalidWebhookSignatureError,
  validateMercadoPagoWebhookSignature,
} from "@/lib/mercadopago/webhook-signature";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const rate = await checkRateLimit({
    key: rateLimitKey("webhooks/mercadopago", request),
    limit: 120,
    windowSeconds: 60,
  });
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds ?? 60);
  }

  const url = new URL(request.url);
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const queryDataId =
    url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? undefined;

  const webhookSecret = getMercadoPagoWebhookSecret();
  if (webhookSecret) {
    try {
      validateMercadoPagoWebhookSignature({
        xSignature,
        xRequestId,
        dataId: queryDataId,
        secret: webhookSecret,
        maxAgeSeconds: 300,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        console.warn("[webhooks/mercadopago] firma inválida");
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
      throw err;
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "[webhooks/mercadopago] MERCADOPAGO_WEBHOOK_SECRET no configurado en producción"
    );
  }

  let topic =
    url.searchParams.get("topic") ??
    url.searchParams.get("type") ??
    undefined;
  let resourceId = queryDataId;

  if (!topic || !resourceId) {
    try {
      const body = (await request.clone().json()) as {
        type?: string;
        action?: string;
        data?: { id?: string | number };
      };
      topic = body.type ?? body.action ?? topic;
      resourceId = body.data?.id != null ? String(body.data.id) : resourceId;
    } catch {
      // body vacio en algunos IPN
    }
  }

  if (!resourceId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (topic !== "payment" && !topic?.includes("payment")) {
    return NextResponse.json({ ok: true, ignored: true, topic });
  }

  try {
    const paymentClient = new Payment(getMercadoPagoClient());
    const payment = await paymentClient.get({ id: resourceId });

    if (!payment.external_reference) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const admin = createServiceClient();
    await fulfillMercadoPagoPayment({
      admin,
      externalReference: payment.external_reference,
      mercadopagoPaymentId: String(payment.id ?? resourceId),
      mercadopagoStatus: payment.status ?? "pending",
      payerId: payment.payer?.id ? String(payment.payer.id) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/mercadopago]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
