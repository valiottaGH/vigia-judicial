/** Tipo de escrito que el abogado quiere generar (selección en el formulario). */
export type DocumentoSolicitado = "cedula" | "oficio" | "mandamiento";

export const DOCUMENTOS_SOLICITADOS: Array<{
  id: DocumentoSolicitado;
  label: string;
  hint: string;
}> = [
  {
    id: "cedula",
    label: "Cédula",
    hint: "Notificar una resolución o traslado a las partes",
  },
  {
    id: "oficio",
    label: "Oficio",
    hint: "Comunicación formal al juzgado u organismo",
  },
  {
    id: "mandamiento",
    label: "Mandamiento",
    hint: "Orden de cumplimiento, embargo o diligencia",
  },
];

export function parseDocumentoSolicitado(
  value: string | null | undefined
): DocumentoSolicitado {
  if (value === "oficio" || value === "mandamiento") return value;
  return "cedula";
}

export function labelDocumentoSolicitado(id: DocumentoSolicitado): string {
  return DOCUMENTOS_SOLICITADOS.find((d) => d.id === id)?.label ?? "Cédula";
}

export function instruccionDocumentoSolicitado(id: DocumentoSolicitado): string {
  switch (id) {
    case "oficio":
      return [
        "El letrado solicitó generar un OFICIO.",
        "Usá tipo_documento=oficio.",
        "Redactá texto_respuesta como oficio judicial dirigido al tribunal u organismo correspondiente (encabezado formal, referencia al expediente, petición o comunicación clara).",
      ].join(" ");
    case "mandamiento":
      return [
        "El letrado solicitó generar un MANDAMIENTO.",
        "Usá tipo_documento=mandamiento.",
        "Redactá texto_respuesta como mandamiento de cumplimiento, embargo, intimación o diligencia según lo ordenado en el proveído.",
      ].join(" ");
    default:
      return [
        "El letrado solicitó generar una CÉDULA.",
        "Usá tipo_documento=cedula.",
        "Redactá texto_respuesta para notificar la resolución o traslado a las partes (fórmulas procesales de cédula).",
      ].join(" ");
  }
}
