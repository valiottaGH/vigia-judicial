import { createServiceClient } from "@/lib/supabase/admin";
import {
  ADJUNTOS_BUCKET,
  INVALID_ADJUNTO_MESSAGE,
  MAX_ADJUNTO_BYTES,
  resolveAdjuntoMime,
  type AllowedAdjuntoMime,
} from "./constants";
import { sanitizeFilename } from "@/lib/actuaciones/zip";
import { validateAdjuntoMagicBytes } from "./magic-bytes";

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

export function validateAdjuntoBuffer(
  buffer: Uint8Array,
  mime: AllowedAdjuntoMime
): void {
  if (buffer.byteLength > MAX_ADJUNTO_BYTES) {
    throw new AdjuntoError(
      `El archivo supera el límite de ${MAX_ADJUNTO_BYTES / (1024 * 1024)} MB`,
      "TOO_LARGE"
    );
  }
  if (!validateAdjuntoMagicBytes(buffer, mime)) {
    throw new AdjuntoError(
      "El contenido del archivo no coincide con el formato declarado",
      "INVALID_TYPE"
    );
  }
}

export function buildAdjuntoStoragePath(input: {
  userId: string;
  expedienteId: string;
  adjuntoId: string;
  fileName: string;
}): string {
  const safeName = sanitizeFilename(input.fileName);
  return `${input.userId}/${input.expedienteId}/${input.adjuntoId}_${safeName}`;
}

export function assertAdjuntoStoragePathOwnedByUser(
  storagePath: string,
  userId: string,
  expedienteId: string,
  adjuntoId: string
): void {
  const expectedPrefix = `${userId}/${expedienteId}/${adjuntoId}_`;
  if (!storagePath.startsWith(expectedPrefix)) {
    throw new AdjuntoError("Ruta de archivo inválida", "NOT_FOUND");
  }
}

export function validateAdjuntoMetadata(input: {
  fileName: string;
  fileSize: number;
  mime: AllowedAdjuntoMime;
}): void {
  if (input.fileSize <= 0) {
    throw new AdjuntoError("El archivo está vacío", "INVALID_TYPE");
  }
  if (input.fileSize > MAX_ADJUNTO_BYTES) {
    throw new AdjuntoError(
      `El archivo supera el límite de ${MAX_ADJUNTO_BYTES / (1024 * 1024)} MB`,
      "TOO_LARGE"
    );
  }
  if (!resolveAdjuntoMime({ name: input.fileName, type: input.mime })) {
    throw new AdjuntoError(INVALID_ADJUNTO_MESSAGE, "INVALID_TYPE");
  }
}

export async function uploadAdjuntoToStorage(input: {
  userId: string;
  expedienteId: string;
  adjuntoId: string;
  file: Pick<File, "name" | "size">;
  mime: AllowedAdjuntoMime;
  buffer: Uint8Array;
}): Promise<string> {
  if (input.buffer.byteLength === 0) {
    throw new AdjuntoError("El archivo llegó vacío al servidor", "INVALID_TYPE");
  }

  validateAdjuntoBuffer(input.buffer, input.mime);

  const storagePath = buildAdjuntoStoragePath({
    userId: input.userId,
    expedienteId: input.expedienteId,
    adjuntoId: input.adjuntoId,
    fileName: input.file.name,
  });

  const admin = createServiceClient();

  const { error } = await admin.storage
    .from(ADJUNTOS_BUCKET)
    .upload(storagePath, input.buffer, {
      contentType: input.mime,
      upsert: false,
    });

  if (error) {
    const detail =
      error.message && error.message !== "HTTP 400 error"
        ? error.message
        : "Revisá permisos del bucket o probá con otro archivo";
    throw new AdjuntoError(
      `No se pudo subir el archivo: ${detail}`,
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
