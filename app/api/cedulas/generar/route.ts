import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import {
  assertAdjuntoStoragePathOwnedByUser,
  downloadAdjuntoFromStorage,
  validateAdjuntoMetadata,
  validateAdjuntoBuffer,
} from "@/lib/adjuntos/storage";
import type { AllowedAdjuntoMime } from "@/lib/adjuntos/constants";
import {
  INVALID_ADJUNTO_MESSAGE,
  isAllowedAdjuntoMime,
} from "@/lib/adjuntos/constants";
import {
  generarDocumentoDesdeInterpretacion,
  persistirInterpretacion,
} from "@/lib/cedulas/generate-from-interpretacion";
import {
  DocumentoNoAptoError,
  interpretarNotificacion,
} from "@/lib/cedulas/interpret-notificacion-ai";
import { documentoDesdeRespuestas } from "@/lib/cedulas/preparar-notificacion-ai";
import { parseDocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import type { GenerarCedulaResponse } from "@/lib/cedulas/types";
import { extraerTextoDocumentoParaIA } from "@/lib/expedientes/preparar-documento-ia";
import { jurisdiccionLabelDesdeKey } from "@/lib/jurisdicciones/options";
import type { ExpedienteActuaciones } from "@/lib/actuaciones/types";
import { PERFIL_ESCRITO_SELECT } from "@/lib/profile/perfil-escrito";
import type { MembreteProfile } from "@/types";
import { isMembreteCompleto, MEMBRETE_REQUIRED_MESSAGE } from "@/lib/profile/membrete";
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

interface GenerarCedulaBody {
  numero?: string;
  caratula?: string;
  tipo_documento?: string;
  expedienteId?: string;
  adjuntoId?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  respuestas?: Record<string, string>;
  datos_preparados?: import("@/lib/cedulas/preparar-escrito").DatosExtraidosEscrito;
}

export async function GET() {
  return NextResponse.json({ ai_disponible: isAiConfigured() });
}

export async function POST(request: NextRequest) {
  try {
    return await handleGenerarCedula(request);
  } catch (err) {
    console.error("[cedulas/generar]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error interno al generar la cédula",
      },
      { status: 500 }
    );
  }
}

async function handleGenerarCedula(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));
  const user = await getUser();

  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: rateLimitKey("cedulas/generar", request, user.id),
    limit: 20,
    windowSeconds: 3600,
  });
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds ?? 3600);
  }

  if (!isAiConfigured()) {
    return json(
      {
        error: aiConfigErrorMessage(),
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      `${PERFIL_ESCRITO_SELECT}, plan, subscription_status, is_admin`
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!isMembreteCompleto(profileData as MembreteProfile | null)) {
    return json(
      {
        error: MEMBRETE_REQUIRED_MESSAGE,
        code: "MEMBRETE_INCOMPLETE",
      },
      { status: 400 }
    );
  }

  const subscriptionStatus = parseSubscriptionStatus(
    profileData?.subscription_status
  );

  const isAdmin =
    Boolean(profileData?.is_admin) || isAdminEmail(user.email);

  let aiQuota;
  try {
    aiQuota = await getUserAiQuota(
      supabase,
      user.id,
      profileData?.plan,
      subscriptionStatus,
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
    const periodo =
      aiQuota.usagePeriod === "lifetime" ? "en total" : "este mes";
    return json(
      {
        error: `Alcanzaste el límite de ${aiQuota.limit} generaciones con IA ${periodo} (plan ${planNombre}). Mejorá tu plan para seguir generando.`,
        code: "PLAN_LIMIT",
        quota: aiQuota,
        upgrade_url: "/dashboard/cuenta?tab=suscripcion",
      },
      { status: 403 }
    );
  }

  let body: GenerarCedulaBody;
  try {
    body = (await request.json()) as GenerarCedulaBody;
  } catch {
    return json(
      {
        error: "Datos inválidos. Volvé a intentar.",
        code: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  }

  const numero = String(body.numero ?? "").trim();
  const caratula = String(body.caratula ?? "").trim();
  const documentoSolicitado = documentoDesdeRespuestas(
    body.respuestas,
    parseDocumentoSolicitado(String(body.tipo_documento ?? ""))
  );
  const expedienteId = String(body.expedienteId ?? "").trim();
  const adjuntoId = String(body.adjuntoId ?? "").trim();
  const storagePath = String(body.storagePath ?? "").trim();
  const fileName = String(body.fileName ?? "").trim();
  const fileSize = Number(body.fileSize ?? 0);
  const mimeRaw = String(body.mimeType ?? "").trim();

  if (!numero || !caratula) {
    return json(
      { error: "Número y carátula son obligatorios" },
      { status: 400 }
    );
  }

  if (!expedienteId || !adjuntoId || !storagePath || !fileName || !mimeRaw) {
    return json(
      { error: "Faltan datos del archivo subido. Volvé a cargar el documento." },
      { status: 400 }
    );
  }

  if (!isAllowedAdjuntoMime(mimeRaw)) {
    return json(
      { error: INVALID_ADJUNTO_MESSAGE, code: "INVALID_FILE_TYPE" },
      { status: 400 }
    );
  }

  const fileMime = mimeRaw as AllowedAdjuntoMime;

  try {
    assertAdjuntoStoragePathOwnedByUser(
      storagePath,
      user.id,
      expedienteId,
      adjuntoId
    );
    validateAdjuntoMetadata({ fileName, fileSize, mime: fileMime });
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : INVALID_ADJUNTO_MESSAGE,
        code: "INVALID_FILE_TYPE",
      },
      { status: 400 }
    );
  }

  const { data: expedienteRow } = await supabase
    .from("expedientes")
    .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
    .eq("id", expedienteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!expedienteRow) {
    return json({ error: "Expediente no encontrado" }, { status: 404 });
  }

  let expediente = { ...expedienteRow, caratula } as ExpedienteActuaciones;

  const jurisdiccionElegida = jurisdiccionLabelDesdeKey(
    body.respuestas?.jurisdiccion_plantilla
  );
  if (jurisdiccionElegida) {
    await supabase
      .from("expedientes")
      .update({ jurisdiccion: jurisdiccionElegida } as never)
      .eq("id", expedienteId);
    expediente = { ...expediente, jurisdiccion: jurisdiccionElegida };
  }

  let bytes: Uint8Array;
  try {
    bytes = await downloadAdjuntoFromStorage(storagePath);
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se encontró el archivo subido. Volvé a cargarlo.",
      },
      { status: 400 }
    );
  }

  if (bytes.byteLength !== fileSize) {
    return json(
      { error: "El tamaño del archivo no coincide. Volvé a subirlo." },
      { status: 400 }
    );
  }

  try {
    validateAdjuntoBuffer(bytes, fileMime);
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : INVALID_ADJUNTO_MESSAGE,
        code: "INVALID_FILE_TYPE",
      },
      { status: 400 }
    );
  }

  let documentoTexto: string;
  try {
    const extraido = await extraerTextoDocumentoParaIA(bytes, fileMime);
    documentoTexto = extraido.texto;
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo leer el documento. Usá PDF, DOC o DOCX.",
      },
      { status: 400 }
    );
  }

  let interpretacion;
  try {
    interpretacion = await interpretarNotificacion({
      numeroExpediente: numero,
      caratula,
      documentoTexto,
      documentoSolicitado,
      respuestasUsuario: body.respuestas,
      datosPreparados: body.datos_preparados,
    });
  } catch (err) {
    if (err instanceof DocumentoNoAptoError) {
      return json({ error: err.message, code: err.code }, { status: 422 });
    }
    const msg = err instanceof Error ? err.message : "Error de IA";
    return json({ error: msg }, { status: 500 });
  }

  const { data: existenteAdjunto } = await supabase
    .from("expediente_adjuntos")
    .select("id")
    .eq("id", adjuntoId)
    .maybeSingle();

  if (!existenteAdjunto) {
    await supabase.from("expediente_adjuntos").insert({
      id: adjuntoId,
      expediente_id: expedienteId,
      user_id: user.id,
      nombre_original: fileName,
      storage_path: storagePath,
      mime_type: fileMime,
      tamano_bytes: fileSize,
    } as never);

    void logSecurityEvent({
      userId: user.id,
      action: "document.upload",
      resourceType: "expediente_adjunto",
      resourceId: adjuntoId,
      metadata: {
        expediente_id: expedienteId,
        mime: fileMime,
        size: fileSize,
      },
      request,
    });
  }

  if (interpretacion.juzgado) {
    await supabase
      .from("expedientes")
      .update({ juzgado: interpretacion.juzgado } as never)
      .eq("id", expedienteId);
    expediente = { ...expediente, juzgado: interpretacion.juzgado };
  }

  if (interpretacion.jurisdiccion && !jurisdiccionElegida) {
    await supabase
      .from("expedientes")
      .update({ jurisdiccion: interpretacion.jurisdiccion } as never)
      .eq("id", expedienteId);
    expediente = { ...expediente, jurisdiccion: interpretacion.jurisdiccion };
  }

  let resolucion;
  let partes;
  try {
    ({ resolucion, partes } = await persistirInterpretacion({
      supabase,
      expedienteId,
      interpretacion,
    }));
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al guardar datos" },
      { status: 500 }
    );
  }

  let generado;
  try {
    generado = await generarDocumentoDesdeInterpretacion({
      userId: user.id,
      expediente,
      resolucion,
      partes,
      interpretacion,
      profile: profileData as MembreteProfile,
      planAtGeneration: aiQuota.effectivePlan,
    });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al generar documento" },
      { status: 500 }
    );
  }

  const response: GenerarCedulaResponse = {
    interpretacion,
    expediente_id: expedienteId,
    actuacion_id: generado.actuacion_id,
    download_url: generado.download_url,
    download_filename: generado.download_filename,
    documentos_count: generado.documentos_count,
  };

  void logSecurityEvent({
    userId: user.id,
    action: "document.generate_ai",
    resourceType: "actuacion",
    resourceId: generado.actuacion_id,
    metadata: {
      expediente_id: expedienteId,
      tipo_documento: documentoSolicitado,
    },
    request,
  });

  return json(response, { status: 201 });
}
