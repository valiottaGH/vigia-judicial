import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import {
  assertPlantillaStoragePathOwnedByUser,
  downloadPlantillaFromStorage,
  validatePlantillaBuffer,
} from "@/lib/plantillas-cedula/storage";
import { PLANTILLA_DOCX_MIME } from "@/lib/plantillas-cedula/constants";

export const runtime = "nodejs";

interface RegistrarBody {
  plantillaId?: string;
  storagePath?: string;
  nombre?: string;
  descripcion?: string;
  fileName?: string;
  fileSize?: number;
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

  let body: RegistrarBody;
  try {
    body = (await request.json()) as RegistrarBody;
  } catch {
    return json({ error: "JSON inválido" }, { status: 400 });
  }

  const plantillaId = body.plantillaId?.trim();
  const storagePath = body.storagePath?.trim();
  const nombre = body.nombre?.trim();
  const fileName = body.fileName?.trim() || "plantilla.docx";
  const fileSize = body.fileSize;

  if (!plantillaId || !storagePath || !nombre) {
    return json(
      { error: "Faltan plantillaId, storagePath o nombre" },
      { status: 400 }
    );
  }

  if (!fileName.toLowerCase().endsWith(".docx")) {
    return json({ error: "Solo se aceptan archivos DOCX" }, { status: 400 });
  }

  if (typeof fileSize !== "number" || fileSize <= 0) {
    return json({ error: "Tamaño de archivo inválido" }, { status: 400 });
  }

  try {
    assertPlantillaStoragePathOwnedByUser(storagePath, user.id, plantillaId);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Ruta inválida" },
      { status: 400 }
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = await downloadPlantillaFromStorage(storagePath);
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
    validatePlantillaBuffer(bytes);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Archivo inválido" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("plantillas_cedula_usuario")
    .insert({
      id: plantillaId,
      user_id: user.id,
      nombre,
      descripcion: body.descripcion?.trim() || null,
      storage_path: storagePath,
      nombre_archivo: fileName,
      mime_type: PLANTILLA_DOCX_MIME,
      tamano_bytes: fileSize,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    return json(
      { error: error?.message ?? "No se pudo registrar la plantilla" },
      { status: 500 }
    );
  }

  return json({ plantilla: data }, { status: 201 });
}
