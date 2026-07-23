/**
 * pdf-parse v1 — estable en Node/Vercel sin DOMMatrix ni canvas nativo.
 */
import pdf from "pdf-parse";

export async function parsePdfText(buffer: Uint8Array): Promise<string> {
  const result = await pdf(Buffer.from(buffer));
  return result.text ?? "";
}
