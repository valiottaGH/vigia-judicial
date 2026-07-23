import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getGenerationLimit,
  parsePlanId,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/subscription/plans";

export interface AiQuota {
  effectivePlan: PlanId;
  usedThisMonth: number;
  limit: number | null;
  remaining: number | null;
  canGenerate: boolean;
}

export function parseSubscriptionStatus(
  value: string | null | undefined
): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "active",
    "trialing",
    "canceled",
    "past_due",
    "none",
  ];
  return allowed.includes(value as SubscriptionStatus)
    ? (value as SubscriptionStatus)
    : "active";
}

/** Plan efectivo segun estado de suscripcion (cancelada = limites free). */
export function effectivePlanId(
  plan: string | null | undefined,
  status: SubscriptionStatus
): PlanId {
  const id = parsePlanId(plan);
  if (id === "free") return "free";
  if (status === "active" || status === "trialing") return id;
  return "free";
}

export function buildAiQuota(
  plan: string | null | undefined,
  status: SubscriptionStatus,
  usedThisMonth: number,
  options?: { isAdmin?: boolean }
): AiQuota {
  if (options?.isAdmin) {
    return {
      effectivePlan: "business",
      usedThisMonth,
      limit: null,
      remaining: null,
      canGenerate: true,
    };
  }

  const effectivePlan = effectivePlanId(plan, status);
  const limit = getGenerationLimit(effectivePlan);
  const remaining = Math.max(0, limit - usedThisMonth);
  return {
    effectivePlan,
    usedThisMonth,
    limit,
    remaining,
    canGenerate: remaining > 0,
  };
}

export async function countMonthlyGenerations(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("actuaciones_generadas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getUserAiQuota(
  supabase: SupabaseClient<Database>,
  userId: string,
  plan: string | null | undefined,
  status: SubscriptionStatus,
  options?: { isAdmin?: boolean }
): Promise<AiQuota> {
  const usedThisMonth = await countMonthlyGenerations(supabase, userId);
  return buildAiQuota(plan, status, usedThisMonth, options);
}
