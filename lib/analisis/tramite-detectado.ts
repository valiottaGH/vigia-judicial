import type { DocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";

export interface TramiteDetectado {
  /** Si el abogado debe redactar/notificar algo procesal */
  requiere_escrito: boolean;
  /** peritos | notificar_partes | traslado | liquidacion | vista_causa | otras | ninguno */
  tipo_tramite: string;
  /** cedula | oficio | mandamiento | null si no aplica */
  tipo_documento_sugerido: DocumentoSolicitado | null;
  /** Breve explicación del trámite detectado o por qué no hay acción */
  descripcion: string;
  /** Cuando requiere_escrito=false, motivo claro para el letrado */
  motivo_sin_escrito: string | null;
}

export const TRAMITE_LABELS: Record<string, string> = {
  peritos: "Designación / pericia",
  notificar_partes: "Notificar partes",
  traslado: "Contestar traslado",
  liquidacion: "Liquidación de honorarios",
  vista_causa: "Vista de causa",
  otras: "Otro trámite judicial",
  ninguno: "Sin trámite pendiente",
};

export function labelTipoTramite(tipo: string): string {
  return TRAMITE_LABELS[tipo] ?? tipo.replace(/_/g, " ");
}

export function parseTramiteDetectado(raw: unknown): TramiteDetectado {
  const base: TramiteDetectado = {
    requiere_escrito: false,
    tipo_tramite: "ninguno",
    tipo_documento_sugerido: null,
    descripcion: "No se pudo determinar el trámite",
    motivo_sin_escrito: "Revisá el documento manualmente",
  };

  if (typeof raw !== "object" || raw === null) return base;

  const t = raw as Record<string, unknown>;
  const requiere =
    t.requiere_escrito === true ||
    t.requiere_escrito === "true" ||
    t.requiere_escrito === 1;

  const tipoDocRaw = String(t.tipo_documento_sugerido ?? "").trim();
  const tipoDoc: DocumentoSolicitado | null =
    tipoDocRaw === "oficio" || tipoDocRaw === "mandamiento"
      ? tipoDocRaw
      : tipoDocRaw === "cedula"
        ? "cedula"
        : null;

  return {
    requiere_escrito: requiere,
    tipo_tramite: String(t.tipo_tramite ?? "ninguno").trim() || "ninguno",
    tipo_documento_sugerido: requiere ? tipoDoc ?? "cedula" : null,
    descripcion: String(t.descripcion ?? "").trim() || base.descripcion,
    motivo_sin_escrito: requiere
      ? null
      : String(t.motivo_sin_escrito ?? t.descripcion ?? "No hay escrito ni respuesta procesal que realizar en base a este documento.").trim(),
  };
}
