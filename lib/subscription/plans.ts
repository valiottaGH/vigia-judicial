/** Definicion de planes — cobro via Mercado Pago Checkout Bricks. */
export type PlanId = "free" | "pro" | "business";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "past_due"
  | "none";

export const PLAN_GENERATION_LIMITS: Record<PlanId, number> = {
  free: 5,
  pro: 500,
  business: 1500,
};

export interface PlanDefinition {
  id: PlanId;
  nombre: string;
  precio: string;
  precioArs: number;
  descripcion: string;
  features: string[];
  destacado?: boolean;
}

export const PLANES: PlanDefinition[] = [
  {
    id: "free",
    nombre: "Gratis",
    precio: "$0 / mes",
    precioArs: 0,
    descripcion: "Para probar el generador con IA.",
    features: [
      "5 generaciones con IA en total",
      "Cédulas y cartas documento",
      "Descarga en Word",
      "Membrete personalizado",
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$5.000 / mes",
    precioArs: 5000,
    descripcion: "Para abogados que generan cédulas a diario.",
    features: [
      "500 generaciones con IA por mes",
      "Todo lo del plan Gratis",
      "Soporte prioritario",
      "Prioridad en nuevas funciones",
    ],
    destacado: true,
  },
  {
    id: "business",
    nombre: "Business",
    precio: "$10.000 / mes",
    precioArs: 10000,
    descripcion: "Para estudios jurídicos y equipos.",
    features: [
      "1.500 generaciones con IA por mes",
      "Todo lo del plan Pro",
      "Usuarios del estudio (próximamente)",
      "Soporte dedicado y onboarding",
    ],
  },
];

export function parsePlanId(value: string | null | undefined): PlanId {
  if (value === "pro" || value === "business") return value;
  return "free";
}

export function getPlan(id: string): PlanDefinition {
  return PLANES.find((p) => p.id === id) ?? PLANES[0];
}

export function getGenerationLimit(planId: PlanId): number {
  return PLAN_GENERATION_LIMITS[planId];
}

export function statusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    active: "Activa",
    trialing: "Periodo de prueba",
    canceled: "Cancelada",
    past_due: "Pago pendiente",
    none: "Sin suscripcion",
  };
  return labels[status] ?? status;
}

export function isPaidPlan(plan: PlanId): boolean {
  return plan === "pro" || plan === "business";
}
