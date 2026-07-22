import JSZip from "jszip";
import type { ManifestPaquete } from "./types";
import { ActuacionError } from "./types";

export interface ZipEntry {
  path: string;
  data: Uint8Array | string;
}

/** Crea buffer ZIP con manifest.json incluido. */
export async function createZipBuffer(
  entries: ZipEntry[],
  manifest: ManifestPaquete
): Promise<Uint8Array> {
  try {
    const zip = new JSZip();

    for (const entry of entries) {
      zip.file(entry.path, entry.data);
    }

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

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
  prefix: string,
  index: number,
  apellido: string,
  nombre: string,
  ext: string
): string {
  const slug = sanitizeFilename(`${apellido}_${nombre}`.trim() || "destinatario");
  const num = String(index).padStart(3, "0");
  return `${prefix}_${num}_${slug}.${ext}`;
}
