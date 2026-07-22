import type { Database } from "@/types/database";
import type { PlantillaVariables } from "@/lib/jurisdicciones/types";

export type ParteExpediente =
  Database["public"]["Tables"]["partes_expediente"]["Row"];
export type Resolucion = Database["public"]["Tables"]["resoluciones"]["Row"];
export type ActuacionGenerada =
  Database["public"]["Tables"]["actuaciones_generadas"]["Row"];

/** Tipos de actuación soportados (extensible vía registro). */
export const TIPOS_ACTUACION = [
  "cedula",
  "oficio",
  "mandamiento",
  "escrito_acompanamiento",
  "notificacion_electronica",
] as const;

export type TipoActuacion = (typeof TIPOS_ACTUACION)[number];

export const TIPOS_ACTUACION_LABELS: Record<TipoActuacion, string> = {
  cedula: "Cédula de notificación",
  oficio: "Oficio",
  mandamiento: "Mandamiento",
  escrito_acompanamiento: "Escrito de acompañamiento",
  notificacion_electronica: "Notificación electrónica",
};

export type RolParte = "actor" | "demandado" | "tercero" | "organismo";

export interface ExpedienteActuaciones {
  id: string;
  numero: string;
  caratula: string | null;
  jurisdiccion: string;
  juzgado: string | null;
  fuero: string | null;
}

export interface ActuacionRequest {
  expediente_id: string;
  resolucion_id: string;
  destinatario_ids: string[];
  tipo_actuacion: TipoActuacion;
  instruccion?: string;
  /** IDs de adjuntos del expediente a incluir en el ZIP */
  adjunto_ids?: string[];
}

/** Resultado del parser de instrucciones en lenguaje natural. */
export interface ParsedInstruction {
  tipo: TipoActuacion | null;
  destinatarios: "all" | "all_demandados" | "all_actores" | "selected";
  organismo?: string;
  subtipo?: string;
  raw: string;
}

export interface DocumentoGenerado {
  nombre_base: string;
  destinatario_id: string | null;
  destinatario_nombre: string;
  tipo: TipoActuacion;
  docx: Uint8Array;
  pdf: Uint8Array | null;
  html_fallback: string | null;
}

export interface ManifestDocumento {
  nombre: string;
  tipo: TipoActuacion | "adjunto";
  destinatario: string;
  formato: "docx" | "pdf" | "html" | "doc" | "adjunto";
}

export interface ManifestPaquete {
  version: "1.0";
  generado_en: string;
  jurisdiccion: string;
  plantilla_key: string;
  expediente_numero: string;
  caratula: string;
  resolucion_id: string;
  tipo_actuacion: TipoActuacion;
  instruccion: string | null;
  documentos: ManifestDocumento[];
}

export interface PaqueteJudicial {
  actuacion_id: string;
  zip_url: string;
  zip_filename: string;
  manifest: ManifestPaquete;
  documentos: DocumentoGenerado[];
  jurisdiccion: string;
  plantilla_key: string;
  plantilla_nombre: string;
  cantidad_documentos: number;
  generado_en: string;
}

export interface GeneracionContext {
  expediente: ExpedienteActuaciones;
  resolucion: Resolucion;
  destinatarios: ParteExpediente[];
  tipo: TipoActuacion;
  variables_base: Omit<PlantillaVariables, "destinatario" | "domicilio">;
  instruccion: string | null;
}

export type ActuacionErrorCode =
  | "UNAUTHORIZED"
  | "EXPEDIENTE_NOT_FOUND"
  | "RESOLUCION_NOT_FOUND"
  | "DESTINATARIOS_VACIOS"
  | "JURISDICCION_SIN_PLANTILLA"
  | "PLANTILLA_INVALIDA"
  | "DOCX_ERROR"
  | "PDF_ERROR"
  | "ZIP_ERROR"
  | "STORAGE_ERROR";

export class ActuacionError extends Error {
  constructor(
    public code: ActuacionErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ActuacionError";
  }
}

export interface ActuacionGeneradaResponse {
  id: string;
  expediente_id: string;
  tipo_actuacion: TipoActuacion;
  jurisdiccion: string;
  plantilla_key: string;
  plantilla_nombre: string;
  documentos_count: number;
  resolucion: Resolucion;
  zip_url: string;
  zip_filename: string;
  manifest: ManifestPaquete;
  created_at: string;
  destinatarios: Array<{
    id: string;
    nombre: string;
    apellido: string;
    rol: RolParte;
    archivos: string[];
  }>;
}
