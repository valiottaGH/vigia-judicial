import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import { isMercadoPagoConfigured, formatMercadoPagoError } from "@/lib/mercadopago/config";
import {
  fulfillMercadoPagoPayment,
  mapMercadoPagoStatus,
} from "@/lib/mercadopago/fulfill-payment";
import { parseExternalReference } from "@/lib/mercadopago/references";
import { getMercadoPagoPlanItem } from "@/lib/mercadopago/plan-items";
import { getPlan, getPlanPriceArs, isPaidPlan, parsePlanId, type PlanId } from "@/lib/subscription/plans";

interface ProcessPaymentBody {
  plan?: string;
  externalReference?: string;
  formData?: Record<string, unknown>;
}

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: "Mercado Pago no configurado", code: "MP_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as ProcessPaymentBody;
  const planId = parsePlanId(body.plan);

  if (!isPaidPlan(planId) || !body.externalReference || !body.formData) {
    return NextResponse.json({ error: "Datos de pago incompletos" }, { status: 400 });
  }

  const parsedRef = parseExternalReference(body.externalReference);
  if (!parsedRef || parsedRef.userId !== user.id || parsedRef.planId !== planId) {
    return NextResponse.json({ error: "Referencia de pago invalida" }, { status: 400 });
  }

  const plan = getPlan(planId);
  const expectedAmount = getPlanPriceArs(planId);
  const admin = createServiceClient();

  const { data: pendingPayment } = await admin
    .from("subscription_payments")
    .select("id, plan_id, amount_ars, status")
    .eq("id", parsedRef.paymentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!pendingPayment) {
    return NextResponse.json(
      { error: "Intento de pago no encontrado. Volvé a iniciar el checkout." },
      { status: 400 }
    );
  }

  if (pendingPayment.plan_id !== planId) {
    return NextResponse.json({ error: "El plan no coincide con el pago" }, { status: 400 });
  }

  const storedAmount = Number(pendingPayment.amount_ars);
  if (storedAmount !== expectedAmount) {
    return NextResponse.json(
      { error: "Monto del plan desactualizado. Volvé a iniciar el checkout." },
      { status: 409 }
    );
  }

  const chargeAmount = expectedAmount;
  const mpItem = getMercadoPagoPlanItem(planId);
  const formData = body.formData;
  const issuerId = formData.issuer_id ?? formData.issuerId;

  const paymentClient = new Payment(getMercadoPagoClient());

  let payment;
  try {
    payment = await paymentClient.create({
      body: {
        transaction_amount: chargeAmount,
        token: String(formData.token ?? ""),
        description: mpItem.title,
        installments: Number(formData.installments ?? 1),
        payment_method_id: String(formData.payment_method_id ?? ""),
        issuer_id: issuerId ? Number(issuerId) : undefined,
        external_reference: body.externalReference,
        additional_info: {
          items: [
            {
              id: mpItem.id,
              title: mpItem.title,
              description: mpItem.description,
              quantity: mpItem.quantity,
              unit_price: mpItem.unit_price,
              category_id: "services",
            },
          ],
        },
        payer: {
          email:
            String(
              (formData.payer as { email?: string } | undefined)?.email ??
                user.email ??
                ""
            ) || user.email,
          identification: (formData.payer as { identification?: object } | undefined)
            ?.identification,
        },
      },
    });
  } catch (err) {
    console.error("[billing/process-payment]", err);
    return NextResponse.json(
      { error: formatMercadoPagoError(err) },
      { status: 402 }
    );
  }

  const mpStatus = payment.status ?? "pending";
  const mapped = mapMercadoPagoStatus(mpStatus);

  let result: { activated: boolean; planId: PlanId | null };
  try {
    result = await fulfillMercadoPagoPayment({
      admin,
      externalReference: body.externalReference,
      mercadopagoPaymentId: String(payment.id ?? ""),
      mercadopagoStatus: mpStatus,
      payerId: payment.payer?.id ? String(payment.payer.id) : null,
    });
  } catch (err) {
    console.error("[billing/process-payment] fulfill", err);
    const detail =
      err instanceof Error ? err.message : "No se pudo activar el plan";
    if (mapped === "approved") {
      return NextResponse.json(
        {
          error: `${detail}. El cobro pudo registrarse en Mercado Pago; contacta soporte si el plan no aparece.`,
          code: "ACTIVATION_FAILED",
          paymentId: payment.id,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }

  if (mapped === "approved") {
    return NextResponse.json({
      status: "approved",
      message: `Pago aprobado. Plan ${plan.nombre} activo por 30 dias.`,
      activated: result.activated,
      paymentId: payment.id,
    });
  }

  if (mapped === "in_process") {
    return NextResponse.json({
      status: "pending",
      message:
        "Pago en proceso. Te avisaremos cuando se acredite y se active tu plan.",
      paymentId: payment.id,
    });
  }

  return NextResponse.json(
    {
      status: mapped,
      error:
        payment.status_detail ??
        "El pago no pudo completarse. Proba con otro medio de pago.",
      paymentId: payment.id,
    },
    { status: 402 }
  );
}
