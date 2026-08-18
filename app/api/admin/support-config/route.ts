import { NextResponse } from "next/server";
import { isAdminResult, requireAdmin } from "@/lib/auth/admin";
import { getSupportConfigStatus } from "@/lib/support/config";

/** Diagnóstico de soporte (solo admin). No expone secretos. */
export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminResult(auth)) return auth;

  const status = getSupportConfigStatus();

  return NextResponse.json({
    ...status,
    hints: status.configured
      ? ["Listo. Probá enviar una consulta desde el widget."]
      : [
          !status.hasResendKey
            ? "Falta RESEND_API_KEY en Vercel (ambiente Production) y redeploy."
            : null,
          !status.hasInbox
            ? "Falta SUPPORT_INBOX_EMAIL o NEXT_PUBLIC_SUPPORT_EMAIL."
            : null,
        ].filter(Boolean),
  });
}
