import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { downloadAdjuntoFromStorage } from "@/lib/adjuntos/storage";
import { DocumentoNoAptoError } from "@/lib/cedulas/interpret-notificacion-ai";
import { prepararEscritoConIA } from "@/lib/cedulas/preparar-notificacion-ai";
import { parseDocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import { extraerTextoDocumentoParaIA } from "@/lib/expedientes/preparar-documento-ia";
import type { DocumentoAnalisis } from "@/lib/analisis/types";
import {
  perfilParaEscrito,
  PERFIL_ESCRITO_SELECT,
} from "@/lib/profile/perfil-escrito";
import { listPlantillasCedulaUsuario } from "@/lib/plantillas-cedula/repository";
import { injectPlantillasUsuarioEnPreparacion } from "@/lib/plantillas-cedula/select-options";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const maxDuration = 90;
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

interface PrepararEscritoBody {
  adjuntoId?: string;
  tipo_documento?: string;
}

function formatContextoAnalisis(
  fila: NonNullable<DocumentoAnalisis["resultado"]>["filas"][number]
): string {
  const lineas = Object.entries(fila.celdas).map(
    ([campo, celda]) =>
      `- ${campo}: ${celda.valor}${celda.cita ? ` (cita: «${celda.cita}»)` : ""}`
  );
  return lineas.join("\n");
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
    key: rateLimitKey("analisis/preparar-escrito", request, user.id),
    limit: 30,
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

  let body: PrepararEscritoBody;
  try {
    body = (await request.json()) as PrepararEscritoBody;
  } catch {
    return json({ error: "JSON inválido" }, { status: 400 });
  }

  const adjuntoId = body.adjuntoId?.trim();
  if (!adjuntoId) {
    return json({ error: "Seleccioná un documento" }, { status: 400 });
  }

  const { data: analisisRow } = await supabase
    .from("documento_analisis")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!analisisRow || analisisRow.estado !== "completado") {
    return json({ error: "El análisis debe estar completado" }, { status: 400 });
  }

  const analisis = analisisRow as unknown as DocumentoAnalisis;
  const fila = analisis.resultado?.filas.find((f) => f.adjunto_id === adjuntoId);
  if (!fila) {
    return json({ error: "Documento no encontrado en el análisis" }, { status: 404 });
  }

  if (fila.tramite && !fila.tramite.requiere_escrito) {
    return json(
      {
        error:
          fila.tramite.motivo_sin_escrito ??
          "No hay escrito que realizar para este documento.",
        code: "SIN_ESCRITO",
      },
      { status: 422 }
    );
  }

  const documentoSolicitado = parseDocumentoSolicitado(
    body.tipo_documento ?? fila.tramite?.tipo_documento_sugerido ?? "cedula"
  );

  const { data: adjunto } = await supabase
    .from("expediente_adjuntos")
    .select("storage_path, mime_type, expediente_id")
    .eq("id", adjuntoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adjunto) {
    return json({ error: "Adjunto no encontrado" }, { status: 404 });
  }

  const { data: expedienteRow } = await supabase
    .from("expedientes")
    .select("numero, caratula")
    .eq("id", adjunto.expediente_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!expedienteRow) {
    return json({ error: "Expediente no encontrado" }, { status: 404 });
  }

  const bytes = await downloadAdjuntoFromStorage(adjunto.storage_path);
  const { texto: documentoTexto, lectura } = await extraerTextoDocumentoParaIA(
    bytes,
    adjunto.mime_type
  );
  const contextoAnalisis = formatContextoAnalisis(fila);

  const { data: profileData } = await supabase
    .from("profiles")
    .select(PERFIL_ESCRITO_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  const perfil = perfilParaEscrito(profileData);

  try {
    const preparacion = await prepararEscritoConIA({
      numeroExpediente: expedienteRow.numero,
      caratula: expedienteRow.caratula ?? "",
      documentoTexto,
      documentoSolicitado,
      contextoAnalisis,
      perfil,
      lectura,
    });

    const plantillasUsuario = await listPlantillasCedulaUsuario(supabase, user.id);

    return json({
      preparacion: injectPlantillasUsuarioEnPreparacion(
        preparacion,
        plantillasUsuario
      ),
    });
  } catch (err) {
    if (err instanceof DocumentoNoAptoError) {
      return json({ error: err.message, code: err.code }, { status: 422 });
    }
    return json(
      { error: err instanceof Error ? err.message : "Error de IA" },
      { status: 500 }
    );
  }
}
