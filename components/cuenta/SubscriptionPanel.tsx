"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PLANES,
  getPlan,
  isPaidPlan,
  statusLabel,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/subscription/plans";
import type { AiQuota } from "@/lib/subscription/entitlements";
import { quotaUsageLabel } from "@/lib/subscription/entitlements";

export default function SubscriptionPanel({
  plan,
  status,
  endsAt,
  aiQuota,
  paymentNotice,
}: {
  plan: PlanId;
  status: SubscriptionStatus;
  endsAt: string | null;
  aiQuota: AiQuota;
  paymentNotice?: "success" | "failure" | "pending" | null;
}) {
  const router = useRouter();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const current = getPlan(plan);
  const paidActive =
    isPaidPlan(plan) && (status === "active" || status === "trialing");
  const canCancel = paidActive;

  async function cancelSubscription() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "No se pudo cancelar la suscripcion");
        return;
      }

      setShowCancelConfirm(false);
      setMessage(data.message ?? "Suscripcion cancelada.");
      router.refresh();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  async function selectPlan(targetPlan: PlanId) {
    if (targetPlan === plan && paidActive) return;

    if (targetPlan === "free") {
      await changePlan("free");
      return;
    }

    router.push(`/dashboard/cuenta/checkout?plan=${targetPlan}`);
  }

  async function changePlan(targetPlan: PlanId) {
    if (targetPlan !== "free") return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_plan", plan: targetPlan }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar el plan");
        return;
      }

      setMessage(data.message ?? "Plan actualizado.");
      router.refresh();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  const paymentNoticeText =
    paymentNotice === "success"
      ? "Pago recibido. Tu plan se activara en unos instantes si aun no lo ves reflejado."
      : paymentNotice === "pending"
        ? "Pago pendiente de acreditacion. Te avisaremos cuando se confirme."
        : paymentNotice === "failure"
          ? "El pago no se completo. Podes intentar de nuevo."
          : null;

  return (
    <div className="space-y-6">
      {paymentNoticeText && (
        <div className="p-3 rounded-lg bg-accent/25 border border-accent text-sm text-gray-900">
          {paymentNoticeText}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">{error}</div>
      )}
      {message && (
        <div className="p-3 rounded-lg bg-accent/25 border border-accent text-success text-sm">
          {message}
        </div>
      )}

      <div className="p-4 bg-card border border-border rounded-xl">
        <p className="text-sm text-muted">Plan actual</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{current.nombre}</p>
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
            Generaciones con IA {quotaUsageLabel(aiQuota.usagePeriod)}:{" "}
            <span className="font-semibold text-primary">
              {aiQuota.used} / {aiQuota.limit}
            </span>
            {aiQuota.remaining !== null && aiQuota.remaining <= 1 && (
              <span className="text-primary-dark ml-1">
                — {aiQuota.remaining === 0 ? "sin cupo restante" : "queda 1"}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm mt-3 text-muted">
            Generaciones con IA: sin límite ({aiQuota.used} este mes)
          </p>
        )}

        <ul className="mt-4 space-y-1">
          {current.features.map((f) => (
            <li key={f} className="text-sm flex items-start gap-2">
              <span className="text-primary font-semibold">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {(paidActive || plan === "free" || status === "canceled") && canCancel && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              disabled={loading}
              className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Cancelar suscripcion
            </button>
          </div>
        )}
      </div>

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-lg space-y-4">
            <h3 id="cancel-title" className="text-lg font-semibold text-gray-900">
              Cancelar suscripcion
            </h3>
            <p className="text-sm text-muted">
              ¿Seguro que queres cancelar tu suscripcion? Vas a volver al plan
              Gratis (5 generaciones en total, sin renovación mensual).
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background disabled:opacity-50"
              >
                No, mantener plan
              </button>
              <button
                type="button"
                onClick={() => void cancelSubscription()}
                disabled={loading}
                className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Cancelando…" : "Si, cancelar suscripcion"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PlanGrid
        currentPlan={plan}
        paidActive={paidActive}
        loading={loading}
        onSelectPlan={(p) => void selectPlan(p)}
      />

      <p className="text-xs text-muted">
        Los planes pagos se abonan con Mercado Pago (Checkout Bricks). Tras el pago
        aprobado, el plan queda activo por 30 dias.
      </p>
    </div>
  );
}

function PlanGrid({
  currentPlan,
  paidActive,
  loading,
  onSelectPlan,
}: {
  currentPlan: PlanId;
  paidActive: boolean;
  loading: boolean;
  onSelectPlan: (plan: PlanId) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANES.map((p) => {
        const isCurrent = p.id === currentPlan && (paidActive || p.id === "free");
        return (
          <div
            key={p.id}
            className={`p-4 rounded-xl border flex flex-col ${
              isCurrent
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
            <p className="font-semibold text-gray-900">{p.nombre}</p>
            <p className="text-lg font-bold mt-1">{p.precio}</p>
            <p className="text-sm text-muted mt-1">{p.descripcion}</p>
            <ul className="mt-3 space-y-1 flex-1">
              {p.features.map((f) => (
                <li key={f} className="text-xs text-muted">
                  • {f}
                </li>
              ))}
            </ul>
            {isCurrent ? (
              <p className="mt-4 text-xs text-center text-muted">Plan actual</p>
            ) : p.id === "free" ? (
              <button
                type="button"
                onClick={() => onSelectPlan("free")}
                disabled={loading}
                className="mt-4 w-full px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background disabled:opacity-50"
              >
                Elegir Gratis
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPlan(p.id)}
                disabled={loading}
                className={`mt-4 w-full px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                  p.destacado
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "border border-primary text-primary hover:bg-primary/5"
                }`}
              >
                {loading ? "Redirigiendo…" : `Pagar ${p.nombre}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
