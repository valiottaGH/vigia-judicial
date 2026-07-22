export const ADJUNTOS_BUCKET = "expediente-adjuntos";

export const MAX_ADJUNTO_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_ADJUNTO_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedAdjuntoMime = (typeof ALLOWED_ADJUNTO_MIMES)[number];

export const ADJUNTO_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isAllowedAdjuntoMime(mime: string): mime is AllowedAdjuntoMime {
  return (ALLOWED_ADJUNTO_MIMES as readonly string[]).includes(mime);
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
