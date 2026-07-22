import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { htmlToPlainParagraphs } from "./html";

export interface MembreteDocumento {
  estudio: string;
  abogado: string;
  matricula: string;
  domicilio: string;
  telefono: string;
  ciudad: string;
}

export async function generateDocumentoDocxBuffer(input: {
  titulo: string;
  contenidoHtml: string;
  membrete: MembreteDocumento;
}): Promise<Uint8Array> {
  const parrafos = htmlToPlainParagraphs(input.contenidoHtml);
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: input.membrete.estudio,
          bold: true,
          size: 28,
        }),
      ],
      spacing: { after: 80 },
    })
  );

  const membreteLineas = [
    input.membrete.abogado,
    input.membrete.matricula ? `Tº ${input.membrete.matricula} CPASF` : "",
    input.membrete.domicilio,
    input.membrete.telefono,
    input.membrete.ciudad,
  ].filter(Boolean);

  for (const linea of membreteLineas) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: linea, size: 20, color: "555555" })],
        spacing: { after: 40 },
      })
    );
  }

  children.push(new Paragraph({ spacing: { after: 200 } }));

  children.push(
    new Paragraph({
      text: input.titulo,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  for (const texto of parrafos) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: texto,
            size: 24,
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
