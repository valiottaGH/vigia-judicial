import React from "react";
import { pdf } from "@react-pdf/renderer";
import { EscritoPdfDocument, type MembretePdf } from "./pdf-document";

export async function generateEscritoPdfBuffer(input: {
  titulo: string;
  contenidoHtml: string;
  membrete: MembretePdf;
}): Promise<Uint8Array> {
  const buffer = await pdf(
    <EscritoPdfDocument
      titulo={input.titulo}
      contenidoHtml={input.contenidoHtml}
      membrete={input.membrete}
    />
  ).toBuffer();

  if (buffer instanceof Uint8Array) {
    return buffer;
  }

  const arrayBuffer = await new Response(buffer as unknown as BodyInit).arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
