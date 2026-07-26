import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from "docx";
import {
  buildMembreteParagraphs,
  buildTitleParagraph,
  bodyParagraph,
  DOCX_FONT,
  DOCX_HEADING_SIZE,
  DOCX_PAGE_MARGINS,
  plainBodyParagraph,
  type MembreteDocumento,
  type TextRunSpec,
} from "./docx-styles";
import { htmlToBlocks, type HtmlBlock } from "./html";

export type { MembreteDocumento } from "./docx-styles";

function blockToParagraph(block: HtmlBlock): Paragraph {
  const runs: TextRunSpec[] =
    block.type === "list-item"
      ? [{ text: "• " }, ...block.runs]
      : block.runs;

  if (block.type === "heading") {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: block.runs.map(
        (run) =>
          new TextRun({
            text: run.text,
            bold: true,
            italics: run.italic,
            size: DOCX_HEADING_SIZE,
            font: DOCX_FONT,
          })
      ),
      heading:
        block.level === 1
          ? HeadingLevel.HEADING_1
          : block.level === 3
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_2,
    });
  }

  return bodyParagraph(runs);
}

export async function generateDocumentoDocxBuffer(input: {
  titulo: string;
  contenidoHtml: string;
  membrete: MembreteDocumento;
}): Promise<Uint8Array> {
  const blocks = htmlToBlocks(input.contenidoHtml);
  const children: Paragraph[] = [
    ...buildMembreteParagraphs(input.membrete),
    buildTitleParagraph(input.titulo),
    ...blocks.map(blockToParagraph),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: { margin: DOCX_PAGE_MARGINS },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export { plainBodyParagraph, buildMembreteParagraphs, buildTitleParagraph };
