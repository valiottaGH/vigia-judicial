import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getMercadoPagoClient } from "@/lib/mercadopago/client";
import {
  formatMercadoPagoError,
  getAppBaseUrl,
  isMercadoPagoConfigured,
  isPublicHttpsAppUrl,
} from "@/lib/mercadopago/config";
import { buildExternalReference } from "@/lib/mercadopago/references";
import { getPlan, isPaidPlan, parsePlanId, type PlanId } from "@/lib/subscription/plans";

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago no esta configurado. Agrega MERCADOPAGO_ACCESS_TOKEN y NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY.",
        code: "MP_NOT_CONFIGURED",
      },
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

  const body = (await request.json()) as { plan?: string };
  const planId = parsePlanId(body.plan);

  if (!isPaidPlan(planId)) {
    return NextResponse.json(
      { error: "Selecciona un plan Pro o Business" },
      { status: 400 }
    );
  }

  const plan = getPlan(planId);
  const paymentId = crypto.randomUUID();
  const externalReference = buildExternalReference(user.id, planId, paymentId);
  const baseUrl = getAppBaseUrl();
  const admin = createServiceClient();

  const { error: insertError } = await admin
    .from("subscription_payments")
    .insert({
      id: paymentId,
      user_id: user.id,
      plan_id: planId,
      amount_ars: plan.precioArs,
      status: "pending",
      external_reference: externalReference,
    } as never);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const preferenceClient = new Preference(getMercadoPagoClient());

  try {
    const preferenceBody: {
      items: Array<{
        id: string;
        title: string;
        description: string;
        quantity: number;
        unit_price: number;
        currency_id: string;
      }>;
      payer: { email?: string };
      external_reference: string;
      statement_descriptor: string;
      notification_url?: string;
      back_urls?: { success: string; failure: string; pending: string };
      auto_return?: "approved";
    } = {
      items: [
        {
          id: planId,
          title: `Fast Cedu — Plan ${plan.nombre}`,
          description: plan.descripcion,
          quantity: 1,
          unit_price: plan.precioArs,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: user.email ?? undefined,
      },
      external_reference: externalReference,
      statement_descriptor: "FAST CEDU",
    };

    if (isPublicHttpsAppUrl(baseUrl)) {
      preferenceBody.notification_url = `${baseUrl}/api/webhooks/mercadopago`;
      preferenceBody.back_urls = {
        success: `${baseUrl}/dashboard/cuenta?tab=suscripcion&payment=success&plan=${planId}`,
        failure: `${baseUrl}/dashboard/cuenta?tab=suscripcion&payment=failure&plan=${planId}`,
        pending: `${baseUrl}/dashboard/cuenta?tab=suscripcion&payment=pending&plan=${planId}`,
      };
      preferenceBody.auto_return = "approved";
    }

    const preference = await preferenceClient.create({
      body: preferenceBody,
    });

    const preferenceId = preference.id;
    if (!preferenceId) {
      return NextResponse.json(
        { error: "No se pudo crear la preferencia de pago" },
        { status: 500 }
      );
    }

    await admin
      .from("subscription_payments")
      .update({
        mercadopago_preference_id: preferenceId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", paymentId);

    return NextResponse.json({
      preferenceId,
      amount: plan.precioArs,
      planId: planId as PlanId,
      planName: plan.nombre,
      externalReference,
    });
  } catch (err) {
    console.error("[billing/preference]", err);
    return NextResponse.json(
      {
        error: formatMercadoPagoError(err),
      },
      { status: 500 }
    );
  }
}
