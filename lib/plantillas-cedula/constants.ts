export const PLANTILLAS_BUCKET = "plantillas-usuario";

export const PLANTILLA_DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;

export const MAX_PLANTILLA_BYTES = 5 * 1024 * 1024;

export const USER_PLANTILLA_PREFIX = "user:";

/** Variables internas (modo avanzado con llaves en el DOCX). */
export const VARIABLES_PLANTILLA_DOCX = [
  { key: "tribunal", label: "Tribunal / juzgado" },
  { key: "caratula", label: "Carátula del expediente" },
  { key: "numero_expediente", label: "Número de expediente" },
  { key: "jurisdiccion", label: "Jurisdicción" },
  { key: "destinatario", label: "Destinatario de la cédula" },
  { key: "domicilio", label: "Domicilio del destinatario" },
  { key: "texto_resolucion", label: "Texto del proveído / resolución" },
  { key: "fecha", label: "Fecha" },
  { key: "abogado", label: "Nombre del letrado" },
  { key: "matricula", label: "Matrícula" },
  { key: "ciudad", label: "Ciudad" },
  { key: "provincia", label: "Provincia" },
] as const;
