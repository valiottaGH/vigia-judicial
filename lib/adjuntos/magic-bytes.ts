import type { AllowedAdjuntoMime } from "./constants";

const PDF_MAGIC = "%PDF";
const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0];
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function startsWithBytes(buffer: Uint8Array, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((b, i) => buffer[i] === b);
}

function startsWithAscii(buffer: Uint8Array, text: string): boolean {
  const encoded = new TextEncoder().encode(text);
  if (buffer.length < encoded.length) return false;
  return encoded.every((b, i) => buffer[i] === b);
}

/** Verifica que el contenido coincida con el MIME declarado (anti-spoofing básico). */
export function validateAdjuntoMagicBytes(
  buffer: Uint8Array,
  mime: AllowedAdjuntoMime
): boolean {
  if (mime === "application/pdf") {
    return startsWithAscii(buffer, PDF_MAGIC);
  }
  if (mime === "application/msword") {
    return startsWithBytes(buffer, OLE_MAGIC);
  }
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return startsWithBytes(buffer, ZIP_MAGIC);
  }
  return false;
}
