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
import { DocumentoNoAptoError } from "@/lib/cedulas/interpret-notificacion-ai";
import { prepararEscritoConIA } from "@/lib/cedulas/preparar-notificacion-ai";
import { parseDocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import { extraerTextoDocumentoParaIA } from "@/lib/expedientes/preparar-documento-ia";
import {
  perfilParaEscrito,
  PERFIL_ESCRITO_SELECT,
} from "@/lib/profile/perfil-escrito";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const maxDuration = 90;
export const runtime = "nodejs";

interface PrepararEscritoBody {
  numero?: string;
  caratula?: string;
  tipo_documento?: string;
  expedienteId?: string;
  adjuntoId?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export async function POST(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: rateLimitKey("cedulas/preparar-escrito", request, user.id),
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

  const numero = String(body.numero ?? "").trim();
  const caratula = String(body.caratula ?? "").trim();
  const documentoSolicitado = parseDocumentoSolicitado(
    String(body.tipo_documento ?? "")
  );
  const expedienteId = String(body.expedienteId ?? "").trim();
  const adjuntoId = String(body.adjuntoId ?? "").trim();
  const storagePath = String(body.storagePath ?? "").trim();
  const fileName = String(body.fileName ?? "").trim();
  const fileSize = Number(body.fileSize ?? 0);
  const mimeRaw = String(body.mimeType ?? "").trim();

  if (!numero || !caratula || !expedienteId || !adjuntoId || !storagePath || !fileName || !mimeRaw) {
    return json({ error: "Faltan datos del archivo" }, { status: 400 });
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

  let bytes: Uint8Array;
  try {
    bytes = await downloadAdjuntoFromStorage(storagePath);
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se encontró el archivo subido.",
      },
      { status: 400 }
    );
  }

  try {
    validateAdjuntoBuffer(bytes, fileMime);
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : INVALID_ADJUNTO_MESSAGE,
        code: "INVALID_FILE_TYPE",
      },
      { status: 400 }
    );
  }

  let documentoTexto: string;
  let lectura: import("@/lib/cedulas/preparar-escrito").PreparacionEscrito["lectura"];
  try {
    const extraido = await extraerTextoDocumentoParaIA(bytes, fileMime);
    documentoTexto = extraido.texto;
    lectura = extraido.lectura;
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo leer el documento.",
      },
      { status: 400 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(PERFIL_ESCRITO_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  const perfil = perfilParaEscrito(profileData);

  try {
    const preparacion = await prepararEscritoConIA({
      numeroExpediente: numero,
      caratula,
      documentoTexto,
      documentoSolicitado,
      perfil,
      lectura,
    });

    return json({ preparacion });
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
