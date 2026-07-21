/** Definicion de planes — la logica de cobro (Stripe) se agregara despues. */
export type PlanId = "free" | "pro";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "past_due"
  | "none";

export interface PlanDefinition {
  id: PlanId;
  nombre: string;
  precio: string;
  descripcion: string;
  features: string[];
}

export const PLANES: PlanDefinition[] = [
  {
    id: "free",
    nombre: "Gratuito",
    precio: "$0 / mes",
    descripcion: "Para probar y redactar escritos basicos.",
    features: [
      "Hasta 10 escritos",
      "Plantillas y editor",
      "Exportar PDF",
      "IA: 5 generaciones / mes",
    ],
  },
  {
    id: "pro",
    nombre: "Profesional",
    precio: "Consultar",
    descripcion: "Para estudios que redactan a diario.",
    features: [
      "Escritos ilimitados",
      "Generacion IA ilimitada",
      "Membrete personalizado en PDF",
      "Soporte prioritario",
    ],
  },
];

export function getPlan(id: string): PlanDefinition {
  return PLANES.find((p) => p.id === id) ?? PLANES[0];
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
