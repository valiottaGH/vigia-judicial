import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/subscription/plans";
import { parseExternalReference } from "./references";

const APPROVED_STATUSES = new Set(["approved", "authorized"]);
const PENDING_STATUSES = new Set(["pending", "in_process", "in_mediation"]);

export function mapMercadoPagoStatus(
  status: string | undefined
): "approved" | "pending" | "rejected" | "cancelled" | "in_process" {
  if (!status) return "pending";
  if (APPROVED_STATUSES.has(status)) return "approved";
  if (PENDING_STATUSES.has(status)) return "in_process";
  if (status === "cancelled") return "cancelled";
  return "rejected";
}

export async function activatePaidPlan(
  admin: SupabaseClient,
  userId: string,
  planId: PlanId,
  mercadopagoPayerId?: string | null
): Promise<void> {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);

  const update: Record<string, unknown> = {
    plan: planId,
    subscription_status: "active",
    subscription_ends_at: endsAt.toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (mercadopagoPayerId) {
    update.mercadopago_payer_id = mercadopagoPayerId;
  }

  const { error } = await admin
    .from("profiles")
    .update(update as never)
    .eq("id", userId);

  if (error) {
    throw new Error(`No se pudo activar el plan: ${error.message}`);
  }
}

export async function fulfillMercadoPagoPayment(input: {
  admin: SupabaseClient;
  externalReference: string;
  mercadopagoPaymentId: string;
  mercadopagoStatus: string;
  payerId?: string | null;
}): Promise<{ activated: boolean; planId: PlanId | null }> {
  const parsed = parseExternalReference(input.externalReference);
  if (!parsed) {
    throw new Error("Referencia de pago invalida");
  }

  const mappedStatus = mapMercadoPagoStatus(input.mercadopagoStatus);

  const { data: existing } = await input.admin
    .from("subscription_payments")
    .select("id, status")
    .eq("id", parsed.paymentId)
    .eq("user_id", parsed.userId)
    .maybeSingle();

  if (!existing) {
    throw new Error("Pago no encontrado en la base de datos");
  }

  if (existing.status === "approved") {
    return { activated: false, planId: parsed.planId };
  }

  await input.admin
    .from("subscription_payments")
    .update({
      mercadopago_payment_id: input.mercadopagoPaymentId,
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", parsed.paymentId);

  if (mappedStatus === "approved") {
    await activatePaidPlan(
      input.admin,
      parsed.userId,
      parsed.planId,
      input.payerId
    );
    return { activated: true, planId: parsed.planId };
  }

  return { activated: false, planId: parsed.planId };
}
