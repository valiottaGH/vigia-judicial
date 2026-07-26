import {
  AlignmentType,
  convertMillimetersToTwip,
  HeadingLevel,
  Paragraph,
  TextRun,
  type IParagraphOptions,
} from "docx";
export interface MembreteDocumento {
  estudio: string;
  abogado: string;
  matricula: string;
  domicilio: string;
  telefono: string;
  ciudad: string;
}

export const DOCX_FONT = "Times New Roman";
export const DOCX_BODY_SIZE = 24;
export const DOCX_SMALL_SIZE = 20;
export const DOCX_TITLE_SIZE = 28;
export const DOCX_HEADING_SIZE = 26;

export const DOCX_PAGE_MARGINS = {
  top: convertMillimetersToTwip(25),
  bottom: convertMillimetersToTwip(25),
  left: convertMillimetersToTwip(30),
  right: convertMillimetersToTwip(25),
};

export const DOCX_BODY_SPACING = {
  line: 360,
  after: 160,
};

export const DOCX_FIRST_LINE_INDENT = convertMillimetersToTwip(12.5);

export function buildMembreteParagraphs(membrete: MembreteDocumento): Paragraph[] {
  const blocks: Paragraph[] = [];

  if (membrete.estudio) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: membrete.estudio,
            bold: true,
            size: DOCX_TITLE_SIZE,
            font: DOCX_FONT,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  const lineas = [
    membrete.abogado,
    membrete.matricula ? `Tº ${membrete.matricula} CPASF` : "",
    membrete.domicilio,
    membrete.telefono,
    membrete.ciudad,
  ].filter(Boolean);

  for (const linea of lineas) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: linea,
            size: DOCX_SMALL_SIZE,
            color: "444444",
            font: DOCX_FONT,
          }),
        ],
        spacing: { after: 40 },
      })
    );
  }

  blocks.push(new Paragraph({ spacing: { after: 240 } }));
  return blocks;
}

export function buildTitleParagraph(titulo: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: titulo,
        bold: true,
        size: DOCX_HEADING_SIZE,
        font: DOCX_FONT,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 280 },
  });
}

export interface TextRunSpec {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export function bodyParagraph(
  runs: TextRunSpec[],
  options: Partial<IParagraphOptions> = {}
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: DOCX_FIRST_LINE_INDENT },
    spacing: DOCX_BODY_SPACING,
    children: runs.map(
      (run) =>
        new TextRun({
          text: run.text,
          bold: run.bold,
          italics: run.italic,
          size: DOCX_BODY_SIZE,
          font: DOCX_FONT,
        })
    ),
    ...options,
  });
}

export function plainBodyParagraph(texto: string): Paragraph {
  return bodyParagraph([{ text: texto }]);
}

export function linesToBodyParagraphs(lines: string[]): Paragraph[] {
  return lines.map((line) => plainBodyParagraph(line));
}
