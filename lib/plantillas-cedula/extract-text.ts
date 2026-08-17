import mammoth from "mammoth";

/** Extrae texto de un DOCX de ejemplo preservando saltos de línea para análisis IA. */
export async function extraerTextoCedulaEjemplo(
  buffer: Uint8Array
): Promise<string> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });
  return (result.value ?? "").replace(/\r\n/g, "\n").trim();
}
