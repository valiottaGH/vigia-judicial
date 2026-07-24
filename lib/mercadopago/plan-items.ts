import { getPlan, getPlanPriceArs, type PaidPlanId, type PlanId } from "@/lib/subscription/plans";

export function getMercadoPagoPlanItem(planId: PaidPlanId) {
  const plan = getPlan(planId);
  const unitPrice = getPlanPriceArs(planId);

  return {
    id: planId,
    title: `Fast Cedu — Plan ${plan.nombre}`,
    description: `${plan.descripcion} — acceso por 30 días`,
    quantity: 1,
    unit_price: unitPrice,
    currency_id: "ARS" as const,
  };
}

export function formatPlanAmountArs(planId: PlanId): string {
  const amount = getPlanPriceArs(planId);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
