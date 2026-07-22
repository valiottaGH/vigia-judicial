import { createServiceClient } from "@/lib/supabase/admin";
import {
  ADJUNTOS_BUCKET,
  INVALID_ADJUNTO_MESSAGE,
  MAX_ADJUNTO_BYTES,
  resolveAdjuntoMime,
  type AllowedAdjuntoMime,
} from "./constants";
import { sanitizeFilename } from "@/lib/actuaciones/zip";

export class AdjuntoError extends Error {
  constructor(
    message: string,
    public code:
      | "INVALID_TYPE"
      | "TOO_LARGE"
      | "STORAGE"
      | "NOT_FOUND"
      = "STORAGE"
  ) {
    super(message);
    this.name = "AdjuntoError";
  }
}

export function validateAdjuntoFile(file: File): AllowedAdjuntoMime {
  const mime = resolveAdjuntoMime(file);
  if (!mime) {
    throw new AdjuntoError(INVALID_ADJUNTO_MESSAGE, "INVALID_TYPE");
  }
  if (file.size > MAX_ADJUNTO_BYTES) {
    throw new AdjuntoError(
      `El archivo supera el límite de ${MAX_ADJUNTO_BYTES / (1024 * 1024)} MB`,
      "TOO_LARGE"
    );
  }
  if (file.size === 0) {
    throw new AdjuntoError("El archivo está vacío", "INVALID_TYPE");
  }
  return mime;
}

export async function uploadAdjuntoToStorage(input: {
  userId: string;
  expedienteId: string;
  adjuntoId: string;
  file: File;
}): Promise<string> {
  const mime = validateAdjuntoFile(input.file);

  const safeName = sanitizeFilename(input.file.name);
  const storagePath = `${input.userId}/${input.expedienteId}/${input.adjuntoId}_${safeName}`;

  const buffer = new Uint8Array(await input.file.arrayBuffer());
  const admin = createServiceClient();

  const { error } = await admin.storage
    .from(ADJUNTOS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    throw new AdjuntoError(
      `No se pudo subir el archivo: ${error.message}. Verificá que el bucket "${ADJUNTOS_BUCKET}" exista en Supabase Storage.`,
      "STORAGE"
    );
  }

  return storagePath;
}

export async function downloadAdjuntoFromStorage(
  storagePath: string
): Promise<Uint8Array> {
  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(ADJUNTOS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new AdjuntoError("No se pudo descargar el adjunto", "NOT_FOUND");
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function deleteAdjuntoFromStorage(storagePath: string): Promise<void> {
  const admin = createServiceClient();
  const { error } = await admin.storage
    .from(ADJUNTOS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new AdjuntoError(`No se pudo eliminar el archivo: ${error.message}`, "STORAGE");
  }
}

export async function createAdjuntoSignedUrl(
  storagePath: string,
  expiresSeconds = 3600
): Promise<string> {
  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(ADJUNTOS_BUCKET)
    .createSignedUrl(storagePath, expiresSeconds);

  if (error || !data?.signedUrl) {
    throw new AdjuntoError("No se pudo generar el enlace de descarga", "STORAGE");
  }

  return data.signedUrl;
}
