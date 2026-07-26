import type { DocumentoSolicitado } from "./documento-solicitado";

/** Categoría 1: lo que decide el abogado. Categoría 2: logística externa al expediente. */
export type CategoriaPreguntaEscrito = "estrategico" | "logistica";

export type TipoCampoEscrito = "text" | "textarea" | "select";

export interface PreguntaEscrito {
  id: string;
  categoria: CategoriaPreguntaEscrito;
  label: string;
  pregunta: string;
  valor_sugerido: string;
  requerido: boolean;
  motivo?: string;
  tipo_campo?: TipoCampoEscrito;
  opciones?: Array<{ value: string; label: string }>;
}

export interface DatosExtraidosEscrito {
  juzgado?: string;
  jurisdiccion?: string;
  caratula?: string;
  numero_expediente?: string;
  fecha_resolucion?: string;
  texto_proveido?: string;
  transcripcion_auto?: string;
  parte_a_notificar?: string;
  partes?: Array<{
    nombre: string;
    apellido: string;
    rol?: string;
    domicilio?: string;
  }>;
}

export interface PerfilEscritoResumen {
  nombre: string;
  matricula: string;
  estudio?: string;
  cuit_cuil?: string;
  caracter?: string;
  domicilio_electronico?: string;
  domicilio_profesional?: string;
  completo: boolean;
}

export interface PreparacionEscrito {
  apto: boolean;
  motivo_rechazo?: string;
  resumen: string;
  tipo_tramite?: string;
  tipo_documento_sugerido?: DocumentoSolicitado;
  datos_extraidos: DatosExtraidosEscrito;
  preguntas: PreguntaEscrito[];
  perfil: PerfilEscritoResumen;
  /** Cómo se preparó el texto del documento para la IA. */
  lectura?: {
    modo: "completo" | "heuristica" | "ia" | "cola";
    chars_originales: number;
    mensaje: string;
  };
}

export type RespuestasEscrito = Record<string, string>;

export const LABEL_CARACTER: Record<string, string> = {
  propio: "Por derecho propio",
  apoderado: "Apoderado/a",
  patrocinante: "Patrocinante",
};

export function preguntasPorCategoria(
  preguntas: PreguntaEscrito[],
  categoria: CategoriaPreguntaEscrito
): PreguntaEscrito[] {
  return preguntas.filter((p) => p.categoria === categoria);
}
