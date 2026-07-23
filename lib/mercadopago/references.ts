import type { PlanId } from "@/lib/subscription/plans";

/** external_reference en Mercado Pago: fc:{userId}:{planId}:{paymentId} */
export function buildExternalReference(
  userId: string,
  planId: PlanId,
  paymentId: string
): string {
  return `fc:${userId}:${planId}:${paymentId}`;
}

export function parseExternalReference(ref: string): {
  userId: string;
  planId: PlanId;
  paymentId: string;
} | null {
  if (!ref.startsWith("fc:")) return null;
  const parts = ref.split(":");
  if (parts.length !== 4) return null;
  const planId = parts[2];
  if (planId !== "pro" && planId !== "business") return null;
  return {
    userId: parts[1],
    planId,
    paymentId: parts[3],
  };
}
