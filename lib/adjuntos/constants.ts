export const ADJUNTOS_BUCKET = "expediente-adjuntos";

export const MAX_ADJUNTO_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_ADJUNTO_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export const ALLOWED_ADJUNTO_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedAdjuntoMime = (typeof ALLOWED_ADJUNTO_MIMES)[number];

export const ADJUNTO_ACCEPT = ALLOWED_ADJUNTO_EXTENSIONS.join(",");

export const INVALID_ADJUNTO_MESSAGE = `No se puede subir. Usa un archivo en uno de estos formatos: ${ALLOWED_ADJUNTO_EXTENSIONS.join(", ")}.`;

export function isAllowedAdjuntoFile(
  file: Pick<File, "name" | "type">
): boolean {
  return resolveAdjuntoMime(file) !== null;
}

export function isAllowedAdjuntoMime(mime: string): mime is AllowedAdjuntoMime {
  return (ALLOWED_ADJUNTO_MIMES as readonly string[]).includes(mime);
}

/** Windows suele dejar file.type vacío en .doc; inferimos por extensión. */
export function resolveAdjuntoMime(
  file: Pick<File, "name" | "type">
): AllowedAdjuntoMime | null {
  if (file.type && isAllowedAdjuntoMime(file.type)) {
    return file.type;
  }

  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "pdf") return "application/pdf";
  if (ext === "doc") return "application/msword";
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return null;
}

export function formatAdjuntoSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function adjuntoExtension(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/msword") return "doc";
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return "bin";
}
