"use client";

import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { useEffect } from "react";
import type { PlanId } from "@/lib/subscription/plans";

let initialized = false;

interface MercadoPagoPaymentBrickProps {
  publicKey: string;
  amount: number;
  planId: PlanId;
  externalReference: string;
  payerEmail?: string | null;
  onSuccess: (payload: { status: string; message?: string }) => void;
  onError: (message: string) => void;
}

function formatBrickError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const payload = error as { message?: string; type?: string; cause?: string };
    if (payload.message) return payload.message;
    if (payload.type) return payload.type;
  }
  return "Error en el formulario de pago";
}

export default function MercadoPagoPaymentBrick({
  publicKey,
  amount,
  planId,
  externalReference,
  payerEmail,
  onSuccess,
  onError,
}: MercadoPagoPaymentBrickProps) {
  useEffect(() => {
    if (!initialized && publicKey) {
      initMercadoPago(publicKey, { locale: "es-AR" });
      initialized = true;
    }
  }, [publicKey]);

  if (!publicKey) {
    return (
      <p className="text-sm text-danger">
        Falta configurar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY.
      </p>
    );
  }

  return (
    <CardPayment
      initialization={{
        amount,
        payer: payerEmail ? { email: payerEmail } : undefined,
      }}
      customization={{
        paymentMethods: {
          maxInstallments: 1,
          minInstallments: 1,
        },
        visual: {
          hideFormTitle: true,
        },
      }}
      onSubmit={async (formData) => {
        const res = await fetch("/api/billing/process-payment", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: planId,
            externalReference,
            formData,
          }),
        });

        const data = (await res.json()) as {
          status?: string;
          message?: string;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo procesar el pago");
        }

        onSuccess({
          status: data.status ?? "approved",
          message: data.message,
        });
      }}
      onError={(error) => {
        onError(formatBrickError(error));
      }}
    />
  );
}
