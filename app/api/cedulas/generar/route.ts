import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import {
  uploadAdjuntoToStorage,
  validateAdjuntoFile,
} from "@/lib/adjuntos/storage";
import type { AllowedAdjuntoMime } from "@/lib/adjuntos/constants";
import {
  INVALID_ADJUNTO_MESSAGE,
} from "@/lib/adjuntos/constants";
import {
  generarDocumentoDesdeInterpretacion,
  persistirInterpretacion,
} from "@/lib/cedulas/generate-from-interpretacion";
import {
  DocumentoNoAptoError,
  interpretarNotificacion,
} from "@/lib/cedulas/interpret-notificacion-ai";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import type { GenerarCedulaResponse } from "@/lib/cedulas/types";
import { extractTextFromBuffer } from "@/lib/expedientes/extract-text";
import type { ExpedienteActuaciones } from "@/lib/actuaciones/types";
import type { MembreteProfile } from "@/types";
import { isMembreteCompleto, MEMBRETE_REQUIRED_MESSAGE } from "@/lib/profile/membrete";
import {
  getUserAiQuota,
  parseSubscriptionStatus,
} from "@/lib/subscription/entitlements";
import { getPlan } from "@/lib/subscription/plans";
import { isAdminEmail } from "@/lib/auth/admin";

export const maxDuration = 60;
export const runtime = "nodejs";

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
      "full_name, estudio_nombre, matricula, domicilio_profesional, telefono, ciudad, plan, subscription_status, is_admin"
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

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return json(
      {
        error: "No se pudo leer el archivo enviado. Debe pesar menos de 4 MB.",
        code: "PAYLOAD_TOO_LARGE",
      },
      { status: 413 }
    );
  }
  const numero = String(formData.get("numero") ?? "").trim();
  const caratula = String(formData.get("caratula") ?? "").trim();
  const file = formData.get("file");

  if (!numero || !caratula) {
    return json(
      { error: "Número y carátula son obligatorios" },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return json(
      { error: "Cargá el proveído o notificación en PDF o Word" },
      { status: 400 }
    );
  }

  let fileMime: AllowedAdjuntoMime;
  try {
    fileMime = validateAdjuntoFile(file);
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error && err.message.includes("No se puede subir")
            ? err.message
            : INVALID_ADJUNTO_MESSAGE,
        code: "INVALID_FILE_TYPE",
      },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let documentoTexto: string;
  try {
    documentoTexto = await extractTextFromBuffer(bytes, fileMime);
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
    });
  } catch (err) {
    if (err instanceof DocumentoNoAptoError) {
      return json({ error: err.message, code: err.code }, { status: 422 });
    }
    const msg = err instanceof Error ? err.message : "Error de IA";
    return json({ error: msg }, { status: 500 });
  }

  const { data: existente } = await supabase
    .from("expedientes")
    .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
    .eq("user_id", user.id)
    .eq("numero", numero)
    .maybeSingle();

  let expediente: ExpedienteActuaciones;

  if (existente) {
    await supabase
      .from("expedientes")
      .update({ caratula } as never)
      .eq("id", existente.id);
    expediente = { ...existente, caratula } as ExpedienteActuaciones;
  } else {
    const { data: creado, error: createError } = await supabase
      .from("expedientes")
      .insert({
        user_id: user.id,
        numero,
        caratula,
        jurisdiccion: "Santa Fe",
      } as never)
      .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
      .single();

    if (createError || !creado) {
      return json(
        { error: createError?.message ?? "Error al crear expediente" },
        { status: 500 }
      );
    }
    expediente = creado as ExpedienteActuaciones;
  }

  const expedienteId = expediente.id;
  const adjuntoId = crypto.randomUUID();

  let storagePath: string;
  try {
    storagePath = await uploadAdjuntoToStorage({
      userId: user.id,
      expedienteId,
      adjuntoId,
      file,
      mime: fileMime,
      buffer: bytes,
    });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al subir archivo" },
      { status: 500 }
    );
  }

  await supabase.from("expediente_adjuntos").insert({
    id: adjuntoId,
    expediente_id: expedienteId,
    user_id: user.id,
    nombre_original: file.name,
    storage_path: storagePath,
    mime_type: fileMime,
    tamano_bytes: file.size,
  } as never);

  if (interpretacion.juzgado) {
    await supabase
      .from("expedientes")
      .update({ juzgado: interpretacion.juzgado } as never)
      .eq("id", expedienteId);
    expediente = { ...expediente, juzgado: interpretacion.juzgado };
  }

  if (interpretacion.jurisdiccion) {
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

  return json(response, { status: 201 });
}
