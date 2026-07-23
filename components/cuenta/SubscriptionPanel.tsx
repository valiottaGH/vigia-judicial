"use client";

import {
  PLANES,
  getPlan,
  isPaidPlan,
  statusLabel,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/subscription/plans";
import type { AiQuota } from "@/lib/subscription/entitlements";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "valentinoliotta3691@gmail.com";

export default function SubscriptionPanel({
  plan,
  status,
  endsAt,
  aiQuota,
}: {
  plan: PlanId;
  status: SubscriptionStatus;
  endsAt: string | null;
  aiQuota: AiQuota;
}) {
  const current = getPlan(plan);
  const paidActive =
    isPaidPlan(plan) && (status === "active" || status === "trialing");

  function contactUpgrade(targetPlan: "pro" | "business") {
    const planDef = getPlan(targetPlan);
    const subject = encodeURIComponent(`Fast Cedu — Plan ${planDef.nombre}`);
    const body = encodeURIComponent(
      `Hola, quiero activar el plan ${planDef.nombre} en Fast Cedu.\n\nMi email de cuenta: `
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-card border border-border rounded-xl">
        <p className="text-sm text-muted">Plan actual</p>
        <p className="text-xl font-bold text-primary mt-1">{current.nombre}</p>
        <p className="text-sm text-muted mt-1">
          Estado: {statusLabel(status)}
          {endsAt && (
            <>
              {" "}
              — vigente hasta{" "}
              {new Date(endsAt).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </>
          )}
        </p>

        {aiQuota.limit !== null ? (
          <p className="text-sm mt-3">
            Generaciones con IA este mes:{" "}
            <span className="font-semibold text-primary">
              {aiQuota.usedThisMonth} / {aiQuota.limit}
            </span>
            {aiQuota.remaining !== null && aiQuota.remaining <= 1 && (
              <span className="text-amber-700 ml-1">
                — {aiQuota.remaining === 0 ? "sin cupo restante" : "queda 1"}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm mt-3 text-muted">
            Generaciones con IA: sin límite ({aiQuota.usedThisMonth} este mes)
          </p>
        )}

        <ul className="mt-4 space-y-1">
          {current.features.map((f) => (
            <li key={f} className="text-sm flex items-start gap-2">
              <span className="text-success">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {!paidActive && (
        <div className="grid gap-4 md:grid-cols-3">
          {PLANES.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border flex flex-col ${
                p.id === plan
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : p.destacado
                    ? "border-primary/40 bg-card"
                    : "border-border bg-card"
              }`}
            >
              {p.destacado && (
                <span className="text-xs font-semibold text-primary mb-1">
                  Recomendado
                </span>
              )}
              <p className="font-semibold text-primary">{p.nombre}</p>
              <p className="text-lg font-bold mt-1">{p.precio}</p>
              <p className="text-sm text-muted mt-1">{p.descripcion}</p>
              <ul className="mt-3 space-y-1 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-muted">
                    • {f}
                  </li>
                ))}
              </ul>
              {p.id === "free" && p.id === plan && (
                <p className="mt-4 text-xs text-center text-muted">Plan actual</p>
              )}
              {p.id === "pro" && plan !== "pro" && plan !== "business" && (
                <button
                  type="button"
                  onClick={() => contactUpgrade("pro")}
                  className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                  Solicitar Pro — {p.precio}
                </button>
              )}
              {p.id === "business" && plan !== "business" && (
                <button
                  type="button"
                  onClick={() => contactUpgrade("business")}
                  className="mt-4 w-full px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5"
                >
                  Solicitar Business — {p.precio}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {paidActive && (
        <p className="text-sm text-muted">
          Para cambiar o cancelar tu suscripcion, escribinos a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      )}

      <p className="text-xs text-muted">
        Los pagos online con tarjeta (Stripe) estaran disponibles proximamente.
        Mientras tanto, activamos los planes Pro y Business manualmente.
      </p>
    </div>
  );
}
