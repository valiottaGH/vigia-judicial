import JSZip from "jszip";
import type { TipoActuacion } from "./types";
import { ActuacionError } from "./types";

export interface ZipEntry {
  path: string;
  data: Uint8Array | string;
}

/** Nombre claro para el ZIP descargable. */
export function buildPaqueteZipFilename(
  numeroExpediente: string,
  tipo: TipoActuacion
): string {
  const num = sanitizeFilename(numeroExpediente.replace(/\s+/g, "-"));
  const tipoLabel =
    tipo === "cedula"
      ? "Cedulas"
      : tipo === "oficio"
        ? "Oficios"
        : tipo === "mandamiento"
          ? "Mandamientos"
          : tipo === "notificacion_electronica"
            ? "Notificaciones"
            : "Documentos";
  return `${tipoLabel}_Exp_${num}.zip`;
}

/** Crea buffer ZIP solo con los documentos generados. */
export async function createZipBuffer(entries: ZipEntry[]): Promise<Uint8Array> {
  try {
    const zip = new JSZip();

    for (const entry of entries) {
      zip.file(entry.path, entry.data);
    }

    const buffer = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return buffer;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    throw new ActuacionError("ZIP_ERROR", `No se pudo crear el ZIP: ${msg}`);
  }
}

/** Sanitiza nombre de archivo para el ZIP. */
export function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

export function buildDocumentFilename(
  tipoLabel: string,
  apellido: string,
  nombre: string,
  ext: string,
  index?: number
): string {
  const destinatario = sanitizeFilename(
    `${apellido} ${nombre}`.trim() || "Destinatario"
  );
  const suffix =
    index !== undefined && index > 1 ? ` (${index})` : "";
  return `${tipoLabel} - ${destinatario}${suffix}.${ext}`;
}
