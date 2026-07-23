/**
 * pdf-parse en Node/Vercel: hay que cargar el worker antes que PDFParse
 * y pasar CanvasFactory (@napi-rs/canvas) para evitar "DOMMatrix is not defined".
 */
import "pdf-parse/worker";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

const canvasFactory = new CanvasFactory();

export async function parsePdfText(buffer: Uint8Array): Promise<string> {
  const parser = new PDFParse({
    data: buffer,
    CanvasFactory: canvasFactory,
  });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}
