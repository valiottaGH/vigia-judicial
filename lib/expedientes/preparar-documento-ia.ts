import type { AllowedAdjuntoMime } from "@/lib/adjuntos/constants";
import {
  extractFullTextFromBuffer,
} from "@/lib/expedientes/extract-text";
import {
  labelExtraccion,
  prepararTextoParaIA,
} from "@/lib/expedientes/extract-proveido";

export async function extraerTextoDocumentoParaIA(
  bytes: Uint8Array,
  mimeType: AllowedAdjuntoMime | string
): Promise<{
  texto: string;
  lectura: {
    modo: "completo" | "heuristica" | "ia" | "cola";
    chars_originales: number;
    mensaje: string;
  };
}> {
  const textoCompleto = await extractFullTextFromBuffer(bytes, mimeType);
  const prep = await prepararTextoParaIA(textoCompleto);
  return {
    texto: prep.texto,
    lectura: {
      modo: prep.extraccion,
      chars_originales: prep.charsOriginales,
      mensaje: labelExtraccion(prep.extraccion, prep.charsOriginales),
    },
  };
}
