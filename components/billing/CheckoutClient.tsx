"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPlan, type PlanId } from "@/lib/subscription/plans";
import { formatPlanAmountArs } from "@/lib/mercadopago/plan-items";

const MercadoPagoPaymentBrick = dynamic(
  () => import("@/components/billing/MercadoPagoPaymentBrick"),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted py-8 text-center">Cargando checkout…</p>
    ),
  }
);

interface CheckoutClientProps {
  planId: PlanId;
  publicKey: string;
}

export default function CheckoutClient({ planId, publicKey }: CheckoutClientProps) {
  const router = useRouter();
  const plan = getPlan(planId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);
  const [amount, setAmount] = useState(plan.precioArs);

  useEffect(() => {
    let cancelled = false;

    async function createPreference() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/billing/preference", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planId }),
        });

        const data = (await res.json()) as {
          preferenceId?: string;
          amount?: number;
          externalReference?: string;
          error?: string;
          code?: string;
        };

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "No se pudo iniciar el checkout");
          return;
        }

        setExternalReference(data.externalReference ?? null);
        if (data.amount) setAmount(data.amount);
      } catch {
        if (!cancelled) setError("Error de conexion al iniciar el pago");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void createPreference();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  function handleSuccess(payload: { status: string; message?: string }) {
    setMessage(
      payload.message ??
        (payload.status === "pending"
          ? "Pago en proceso. Te avisaremos cuando se acredite."
          : "Pago aprobado. Tu plan ya esta activo.")
    );
    setTimeout(() => {
      router.push("/dashboard/cuenta?tab=suscripcion&payment=success");
      router.refresh();
    }, 1800);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/cuenta?tab=suscripcion"
          className="text-sm text-primary hover:underline"
        >
          ← Volver a suscripcion
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">
          Pagar plan {plan.nombre}
        </h1>
        <p className="text-lg font-semibold text-gray-900 mt-3">
          Total a pagar: {formatPlanAmountArs(planId)}
        </p>
        <p className="text-sm text-muted mt-1">
          {plan.precio} — acceso por 30 dias. Pagá con tarjeta de credito o debito.
        </p>
        <p className="text-xs text-muted mt-2">
          Tarjetas de prueba MP: titular <strong className="text-gray-900">APRO</strong>,
          Mastercard <strong className="text-gray-900">5031 7557 3454 0604</strong>, CVV{" "}
          <strong className="text-gray-900">123</strong>, venc.{" "}
          <strong className="text-gray-900">11/30</strong>.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">{error}</div>
      )}
      {message && (
        <div className="p-3 rounded-lg bg-accent/25 border border-accent text-gray-900 text-sm">
          {message}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        {loading && (
          <p className="text-sm text-muted py-8 text-center">
            Preparando checkout…
          </p>
        )}

        {!loading && externalReference && !message && (
          <MercadoPagoPaymentBrick
            publicKey={publicKey}
            amount={amount}
            planId={planId}
            externalReference={externalReference}
            onSuccess={handleSuccess}
            onError={setError}
          />
        )}
      </div>

      <p className="text-xs text-muted">
        Al confirmar el pago aceptas la suscripcion mensual del plan seleccionado.
        Mercado Pago procesa el cobro de forma segura.
      </p>
    </div>
  );
}
