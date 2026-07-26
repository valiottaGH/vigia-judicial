import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { parsePdfText } from "@/lib/expedientes/pdf-server";

const MAX_CHARS_PER_FILE = 8000;
const MAX_TOTAL_CHARS = 24000;
/** Tope de seguridad al leer texto completo antes de aislar el proveído. */
const MAX_FULL_TEXT = 500_000;

export async function extractFullTextFromBuffer(
  buffer: Uint8Array,
  mimeType: string
): Promise<string> {
  const text = await extractTextFromBuffer(buffer, mimeType, { noTruncate: true });
  return text;
}

export async function extractTextFromBuffer(
  buffer: Uint8Array,
  mimeType: string,
  opts?: { noTruncate?: boolean }
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer, opts?.noTruncate);
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(buffer, opts?.noTruncate);
  }
  if (mimeType === "application/msword") {
    return extractDocText(buffer, opts?.noTruncate);
  }
  throw new Error(`Tipo de archivo no soportado para lectura: ${mimeType}`);
}

async function extractPdfText(buffer: Uint8Array, noTruncate?: boolean): Promise<string> {
  try {
    const text = await parsePdfText(buffer);
    return truncate(text, noTruncate);
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `No se pudo leer el PDF: ${err.message}`
        : "No se pudo leer el PDF"
    );
  }
}

async function extractDocxText(buffer: Uint8Array, noTruncate?: boolean): Promise<string> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });
  return truncate(result.value ?? "", noTruncate);
}

async function extractDocText(buffer: Uint8Array, noTruncate?: boolean): Promise<string> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(Buffer.from(buffer));
  return truncate(doc.getBody() ?? "", noTruncate);
}

function truncate(text: string, noTruncate?: boolean): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const limit = noTruncate ? MAX_FULL_TEXT : MAX_CHARS_PER_FILE;
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit)}… [texto truncado]`;
}

export function mergeDocumentTexts(
  sections: Array<{ titulo: string; texto: string }>
): string {
  let total = "";
  const parts: string[] = [];

  for (const section of sections) {
    if (!section.texto.trim()) continue;
    const block = `### ${section.titulo}\n${section.texto}`;
    if (total.length + block.length > MAX_TOTAL_CHARS) {
      const remaining = MAX_TOTAL_CHARS - total.length;
      if (remaining > 200) {
        parts.push(`${block.slice(0, remaining)}… [truncado]`);
      }
      break;
    }
    parts.push(block);
    total += block;
  }

  return parts.join("\n\n");
}
