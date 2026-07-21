"use client";

import {
  PLANES,
  getPlan,
  statusLabel,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/subscription/plans";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "valentinoliotta3691@gmail.com";

export default function SubscriptionPanel({
  plan,
  status,
  endsAt,
}: {
  plan: PlanId;
  status: SubscriptionStatus;
  endsAt: string | null;
}) {
  const current = getPlan(plan);
  const isPro = plan === "pro" && status === "active";

  function contactUpgrade() {
    const subject = encodeURIComponent("Vigia Judicial — Plan Profesional");
    const body = encodeURIComponent(
      "Hola, quiero activar el plan Profesional en Vigia Judicial.\n\nMi email de cuenta: "
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
        <ul className="mt-4 space-y-1">
          {current.features.map((f) => (
            <li key={f} className="text-sm flex items-start gap-2">
              <span className="text-success">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {!isPro && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANES.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border ${
                p.id === plan
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              <p className="font-semibold text-primary">{p.nombre}</p>
              <p className="text-lg font-bold mt-1">{p.precio}</p>
              <p className="text-sm text-muted mt-1">{p.descripcion}</p>
              <ul className="mt-3 space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-muted">
                    • {f}
                  </li>
                ))}
              </ul>
              {p.id === "pro" && (
                <button
                  type="button"
                  onClick={contactUpgrade}
                  className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                  Solicitar plan Pro
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isPro && (
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
        Mientras tanto, activamos el plan Pro manualmente.
      </p>
    </div>
  );
}
