import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getGenerationLimit,
  parsePlanId,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/subscription/plans";

function startOfCurrentMonthIso(): string {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth.toISOString();
}

export type QuotaUsagePeriod = "lifetime" | "month";

export interface AiQuota {
  effectivePlan: PlanId;
  used: number;
  limit: number | null;
  remaining: number | null;
  canGenerate: boolean;
  usagePeriod: QuotaUsagePeriod;
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
  used: number,
  usagePeriod: QuotaUsagePeriod,
  options?: { isAdmin?: boolean }
): AiQuota {
  if (options?.isAdmin) {
    return {
      effectivePlan: "business",
      used,
      limit: null,
      remaining: null,
      canGenerate: true,
      usagePeriod: "month",
    };
  }

  const effectivePlan = effectivePlanId(plan, status);
  const limit = getGenerationLimit(effectivePlan);
  const remaining = Math.max(0, limit - used);
  return {
    effectivePlan,
    used,
    limit,
    remaining,
    canGenerate: remaining > 0,
    usagePeriod,
  };
}

export async function countMonthlyGenerations(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("actuaciones_generadas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfCurrentMonthIso());

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/** Generaciones en plan Gratis, de por vida (no se renuevan al cambiar de plan). */
export async function countLifetimeFreeGenerations(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("actuaciones_generadas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("plan_at_generation", "free");

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
  const effectivePlan = effectivePlanId(plan, status);

  if (effectivePlan === "free") {
    const used = await countLifetimeFreeGenerations(supabase, userId);
    return buildAiQuota(plan, status, used, "lifetime", options);
  }

  const used = await countMonthlyGenerations(supabase, userId);
  return buildAiQuota(plan, status, used, "month", options);
}

export function quotaUsageLabel(period: QuotaUsagePeriod): string {
  return period === "lifetime" ? "en total" : "este mes";
}
