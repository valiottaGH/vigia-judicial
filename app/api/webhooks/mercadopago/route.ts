import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { createServiceClient } from "@/lib/supabase/admin";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import { fulfillMercadoPagoPayment } from "@/lib/mercadopago/fulfill-payment";

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const url = new URL(request.url);
  let topic =
    url.searchParams.get("topic") ??
    url.searchParams.get("type") ??
    undefined;
  let resourceId =
    url.searchParams.get("id") ??
    url.searchParams.get("data.id") ??
    undefined;

  if (!topic || !resourceId) {
    try {
      const body = (await request.json()) as {
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
