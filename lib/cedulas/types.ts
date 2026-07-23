import type { RolParte, TipoActuacion } from "@/lib/actuaciones/types";

export type TipoDocumentoGenerado = TipoActuacion | "carta_documento" | "liquidacion_honorarios";

export interface ConceptoLiquidacion {
  descripcion: string;
  base: string | null;
  monto: string;
}

export interface LiquidacionHonorarios {
  tipo_honorarios: string | null;
  base_regulatoria: string | null;
  conceptos: ConceptoLiquidacion[];
  subtotal: string | null;
  iva: string | null;
  total: string | null;
  moneda: string | null;
}

export interface ParteInterpretada {
  nombre: string;
  apellido: string;
  rol: RolParte;
  domicilio: string | null;
  notificar: boolean;
}

export interface InterpretacionNotificacion {
  tipo_tramite: string;
  tipo_documento: TipoDocumentoGenerado;
  resumen: string;
  texto_proveido: string;
  texto_respuesta: string;
  fecha_resolucion: string | null;
  juzgado: string | null;
  jurisdiccion: string | null;
  partes: ParteInterpretada[];
  liquidacion?: LiquidacionHonorarios;
  variables_carta?: {
    destinatario?: string;
    domicilio_destinatario?: string;
    monto?: string;
    concepto?: string;
    plazo?: string;
  };
}

export interface GenerarCedulaResponse {
  interpretacion: InterpretacionNotificacion;
  expediente_id: string;
  actuacion_id?: string;
  download_url?: string;
  download_filename?: string;
  documentos_count?: number;
}
