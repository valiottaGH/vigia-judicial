import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeFilename } from "@/lib/actuaciones/zip";
import { validateAdjuntoMagicBytes } from "@/lib/adjuntos/magic-bytes";
import {
  MAX_PLANTILLA_BYTES,
  PLANTILLA_DOCX_MIME,
  PLANTILLAS_BUCKET,
} from "./constants";

export class PlantillaCedulaError extends Error {
  constructor(
    message: string,
    public code: "INVALID_TYPE" | "TOO_LARGE" | "STORAGE" | "NOT_FOUND" = "STORAGE"
  ) {
    super(message);
    this.name = "PlantillaCedulaError";
  }
}

export function buildPlantillaStoragePath(input: {
  userId: string;
  plantillaId: string;
  fileName: string;
}): string {
  const safeName = sanitizeFilename(input.fileName);
  return `${input.userId}/${input.plantillaId}_${safeName}`;
}

export function assertPlantillaStoragePathOwnedByUser(
  storagePath: string,
  userId: string,
  plantillaId: string
): void {
  const expectedPrefix = `${userId}/${plantillaId}_`;
  if (!storagePath.startsWith(expectedPrefix)) {
    throw new PlantillaCedulaError("Ruta de plantilla inválida", "NOT_FOUND");
  }
}

export function validatePlantillaFile(file: Pick<File, "name" | "size" | "type">): void {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".docx")) {
    throw new PlantillaCedulaError(
      "Solo se aceptan archivos DOCX (.docx)",
      "INVALID_TYPE"
    );
  }
  if (file.size <= 0) {
    throw new PlantillaCedulaError("El archivo está vacío", "INVALID_TYPE");
  }
  if (file.size > MAX_PLANTILLA_BYTES) {
    throw new PlantillaCedulaError(
      `El archivo supera el límite de ${MAX_PLANTILLA_BYTES / (1024 * 1024)} MB`,
      "TOO_LARGE"
    );
  }
}

export function validatePlantillaBuffer(buffer: Uint8Array): void {
  if (buffer.byteLength <= 0) {
    throw new PlantillaCedulaError("El archivo está vacío", "INVALID_TYPE");
  }
  if (buffer.byteLength > MAX_PLANTILLA_BYTES) {
    throw new PlantillaCedulaError(
      `El archivo supera el límite de ${MAX_PLANTILLA_BYTES / (1024 * 1024)} MB`,
      "TOO_LARGE"
    );
  }
  if (!validateAdjuntoMagicBytes(buffer, PLANTILLA_DOCX_MIME)) {
    throw new PlantillaCedulaError(
      "El contenido no es un DOCX válido",
      "INVALID_TYPE"
    );
  }
}

export async function downloadPlantillaFromStorage(
  storagePath: string
): Promise<Uint8Array> {
  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(PLANTILLAS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new PlantillaCedulaError(
      "No se pudo descargar la plantilla",
      "NOT_FOUND"
    );
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function deletePlantillaFromStorage(storagePath: string): Promise<void> {
  const admin = createServiceClient();
  const { error } = await admin.storage
    .from(PLANTILLAS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new PlantillaCedulaError(
      `No se pudo eliminar la plantilla: ${error.message}`,
      "STORAGE"
    );
  }
}
