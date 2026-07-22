import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { DocumentoPlantilla } from "@/lib/jurisdicciones/types";
import { ActuacionError } from "./types";

function splitLines(text: string): string[] {
  return text.split("\n").filter((l) => l.length > 0);
}

function linesToParagraphs(lines: string[], bold = false): Paragraph[] {
  return lines.map(
    (line) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: line,
            bold,
            size: 24,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 120 },
      })
  );
}

/** Convierte un DocumentoPlantilla a buffer DOCX. */
export async function documentoToDocx(doc: DocumentoPlantilla): Promise<Uint8Array> {
  try {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        text: doc.titulo,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    );

    if (doc.encabezado) {
      children.push(...linesToParagraphs(splitLines(doc.encabezado)));
    }

    children.push(...linesToParagraphs(splitLines(doc.cuerpo)));

    if (doc.pie) {
      children.push(
        new Paragraph({ spacing: { before: 360 } }),
        ...linesToParagraphs(splitLines(doc.pie))
      );
    }

    const document = new Document({
      sections: [{ properties: {}, children }],
    });

    return await Packer.toBuffer(document);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    throw new ActuacionError("DOCX_ERROR", `No se pudo generar DOCX: ${msg}`);
  }
}
