const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount:
    "Saldo insuficiente en la tarjeta. Verificá el disponible o probá con otro medio de pago.",
  insufficient_amount:
    "Saldo insuficiente en la tarjeta. Verificá el disponible o probá con otro medio de pago.",
  cc_rejected_call_for_authorize:
    "Tu banco debe autorizar el pago. Contactá al banco o probá con otra tarjeta.",
  cc_rejected_card_disabled:
    "La tarjeta está deshabilitada para compras online. Contactá al banco o usá otra tarjeta.",
  cc_rejected_duplicated_payment:
    "Ya registramos un pago similar reciente. Revisá tu cuenta antes de intentar de nuevo.",
  cc_rejected_max_attempts:
    "Superaste el límite de intentos con esta tarjeta. Probá con otro medio de pago.",
  cc_rejected_bad_filled_card_number: "Número de tarjeta inválido. Revisá los datos e intentá de nuevo.",
  cc_rejected_bad_filled_date: "Fecha de vencimiento inválida. Revisá los datos e intentá de nuevo.",
  cc_rejected_bad_filled_security_code: "Código de seguridad inválido. Revisá los datos e intentá de nuevo.",
  cc_rejected_bad_filled_other: "Datos de la tarjeta incorrectos. Revisá e intentá de nuevo.",
  cc_rejected_other_reason: "El pago no pudo completarse. Probá con otro medio de pago.",
  cc_rejected_time_out:
    "El pago tardó demasiado en procesarse. Intentá de nuevo en unos minutos.",
  rejected_by_bank: "El banco rechazó el pago. Contactá a tu entidad o probá con otra tarjeta.",
};

export function getMercadoPagoRejectionMessage(
  statusDetail: string | null | undefined
): string {
  if (!statusDetail) {
    return "El pago no pudo completarse. Probá con otro medio de pago.";
  }

  const normalized = statusDetail.trim().toLowerCase();
  return REJECTION_MESSAGES[normalized] ?? "El pago no pudo completarse. Probá con otro medio de pago.";
}

function extractStatusDetailFromError(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;

  const payload = err as {
    status_detail?: string;
    statusDetail?: string;
    cause?: Array<{ code?: string; description?: string }>;
  };

  if (payload.status_detail) return payload.status_detail;
  if (payload.statusDetail) return payload.statusDetail;

  if (Array.isArray(payload.cause)) {
    for (const item of payload.cause) {
      if (item.code?.startsWith("cc_rejected_") || item.code === "insufficient_amount") {
        return item.code;
      }
    }
  }

  return null;
}

export function formatMercadoPagoPaymentError(err: unknown): string {
  const statusDetail = extractStatusDetailFromError(err);
  if (statusDetail) {
    return getMercadoPagoRejectionMessage(statusDetail);
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  if (typeof err === "object" && err !== null) {
    const payload = err as { message?: string; error?: string };
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
  }

  return "Error de Mercado Pago";
}
