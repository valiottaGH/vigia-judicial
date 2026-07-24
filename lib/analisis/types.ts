export interface CampoExtraccion {
  id: string;
  label: string;
  descripcion: string;
}

export interface CeldaAnalisis {
  valor: string;
  cita: string;
}

export interface FilaAnalisis {
  documento: string;
  adjunto_id: string;
  celdas: Record<string, CeldaAnalisis>;
}

export interface ResultadoAnalisis {
  filas: FilaAnalisis[];
  resumen: string | null;
  lectura_errores: string[];
}

export interface PlantillaSistema {
  key: string;
  nombre: string;
  descripcion: string;
  campos: CampoExtraccion[];
}

export interface AnalisisPlantilla {
  id: string;
  user_id: string;
  nombre: string;
  campos: CampoExtraccion[];
  created_at: string;
  updated_at: string;
}

export interface DocumentoAnalisis {
  id: string;
  user_id: string;
  nombre: string;
  expediente_id: string | null;
  plantilla_id: string | null;
  plantilla_key: string | null;
  campos: CampoExtraccion[];
  adjunto_ids: string[];
  resultado: ResultadoAnalisis | null;
  estado: "borrador" | "procesando" | "completado" | "error";
  error_mensaje: string | null;
  created_at: string;
  updated_at: string;
}
