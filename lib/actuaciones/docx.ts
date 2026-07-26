import {
  Document,
  Packer,
  Paragraph,
  SectionType,
} from "docx";
import type { DocumentoPlantilla } from "@/lib/jurisdicciones/types";
import {
  buildMembreteParagraphs,
  buildTitleParagraph,
  linesToBodyParagraphs,
  plainBodyParagraph,
  DOCX_PAGE_MARGINS,
  type MembreteDocumento,
} from "@/lib/documents/docx-styles";
import { ActuacionError } from "./types";

function splitLines(text: string): string[] {
  return text.split("\n").filter((l) => l.length > 0);
}

/** Convierte un DocumentoPlantilla a buffer DOCX con membrete y formato profesional. */
export async function documentoToDocx(
  doc: DocumentoPlantilla,
  membrete?: MembreteDocumento
): Promise<Uint8Array> {
  try {
    const children: Paragraph[] = [];

    if (membrete) {
      children.push(...buildMembreteParagraphs(membrete));
    }

    children.push(buildTitleParagraph(doc.titulo));

    if (doc.encabezado) {
      children.push(...linesToBodyParagraphs(splitLines(doc.encabezado)));
      children.push(plainBodyParagraph(""));
    }

    children.push(...linesToBodyParagraphs(splitLines(doc.cuerpo)));

    if (doc.pie) {
      children.push(new Paragraph({ spacing: { before: 360 } }));
      children.push(...linesToBodyParagraphs(splitLines(doc.pie)));
    }

    const document = new Document({
      sections: [
        {
          properties: {
            page: { margin: DOCX_PAGE_MARGINS },
          },
          children,
        },
      ],
    });

    return await Packer.toBuffer(document);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    throw new ActuacionError("DOCX_ERROR", `No se pudo generar DOCX: ${msg}`);
  }
}
