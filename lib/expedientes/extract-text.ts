import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { PDFParse } from "pdf-parse";

const MAX_CHARS_PER_FILE = 8000;
const MAX_TOTAL_CHARS = 24000;

export async function extractTextFromBuffer(
  buffer: Uint8Array,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(buffer);
  }
  if (mimeType === "application/msword") {
    return extractDocText(buffer);
  }
  throw new Error(`Tipo de archivo no soportado para lectura: ${mimeType}`);
}

async function extractPdfText(buffer: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return truncate(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Uint8Array): Promise<string> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });
  return truncate(result.value ?? "");
}

async function extractDocText(buffer: Uint8Array): Promise<string> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(Buffer.from(buffer));
  return truncate(doc.getBody() ?? "");
}

function truncate(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= MAX_CHARS_PER_FILE) return cleaned;
  return `${cleaned.slice(0, MAX_CHARS_PER_FILE)}… [texto truncado]`;
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
