import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { parseDocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";
import { generarEscritoDesdeAnalisis } from "@/lib/analisis/generar-escrito";
import type { DocumentoAnalisis } from "@/lib/analisis/types";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import { isMembreteCompleto, MEMBRETE_REQUIRED_MESSAGE } from "@/lib/profile/membrete";
import type { MembreteProfile } from "@/types";
import {
  getUserAiQuota,
  parseSubscriptionStatus,
} from "@/lib/subscription/entitlements";
import { getPlan } from "@/lib/subscription/plans";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit-log";

export const maxDuration = 120;
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

interface GenerarEscritoBody {
  adjuntoId?: string;
  tipo_documento?: string;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: rateLimitKey("analisis/generar-escrito", request, user.id),
    limit: 20,
    windowSeconds: 3600,
  });
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds ?? 3600);
  }

  if (!isAiConfigured()) {
    return json(
      { error: aiConfigErrorMessage(), code: "AI_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let body: GenerarEscritoBody;
  try {
    body = (await request.json()) as GenerarEscritoBody;
  } catch {
    return json({ error: "JSON inválido" }, { status: 400 });
  }

  const adjuntoId = body.adjuntoId?.trim();

  if (!adjuntoId) {
    return json({ error: "Seleccioná un documento de la tabla" }, { status: 400 });
  }

  const { data: analisisRow } = await supabase
    .from("documento_analisis")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!analisisRow || analisisRow.estado !== "completado") {
    return json(
      { error: "El análisis debe estar completado antes de generar un escrito" },
      { status: 400 }
    );
  }

  const analisis = analisisRow as unknown as DocumentoAnalisis;

  const fila = analisis.resultado?.filas.find((f) => f.adjunto_id === adjuntoId);
  if (fila?.tramite && !fila.tramite.requiere_escrito) {
    return json(
      {
        error:
          fila.tramite.motivo_sin_escrito ??
          "No hay escrito ni respuesta procesal que realizar para este documento.",
        code: "SIN_ESCRITO",
      },
      { status: 422 }
    );
  }

  const documentoSolicitado = parseDocumentoSolicitado(
    body.tipo_documento ?? fila?.tramite?.tipo_documento_sugerido ?? "cedula"
  );

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "full_name, estudio_nombre, matricula, domicilio_profesional, telefono, ciudad, plan, subscription_status, is_admin"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!isMembreteCompleto(profileData as MembreteProfile | null)) {
    return json(
      { error: MEMBRETE_REQUIRED_MESSAGE, code: "MEMBRETE_INCOMPLETE" },
      { status: 400 }
    );
  }

  const isAdmin =
    Boolean(profileData?.is_admin) || isAdminEmail(user.email);

  let aiQuota;
  try {
    aiQuota = await getUserAiQuota(
      supabase,
      user.id,
      profileData?.plan,
      parseSubscriptionStatus(profileData?.subscription_status),
      { isAdmin }
    );
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al verificar plan" },
      { status: 500 }
    );
  }

  if (!aiQuota.canGenerate) {
    const planNombre = getPlan(aiQuota.effectivePlan).nombre;
    return json(
      {
        error: `Alcanzaste el límite de generaciones con IA (plan ${planNombre}).`,
        code: "PLAN_LIMIT",
      },
      { status: 403 }
    );
  }

  try {
    const generado = await generarEscritoDesdeAnalisis({
      supabase,
      userId: user.id,
      analisis,
      adjuntoId,
      documentoSolicitado,
      profile: profileData as MembreteProfile,
      planAtGeneration: aiQuota.effectivePlan,
    });

    void logSecurityEvent({
      userId: user.id,
      action: "document.generate_ai",
      resourceType: "actuacion",
      resourceId: generado.actuacion_id,
      metadata: {
        analisis_id: id,
        adjunto_id: adjuntoId,
        tipo_documento: documentoSolicitado,
      },
      request,
    });

    return json(generado, { status: 201 });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al generar escrito" },
      { status: 500 }
    );
  }
}
