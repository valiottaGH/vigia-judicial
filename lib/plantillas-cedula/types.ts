import type { VARIABLES_PLANTILLA_DOCX } from "./constants";

export type ClavePlantillaCedula = (typeof VARIABLES_PLANTILLA_DOCX)[number]["key"];

export interface ReemplazoPlantillaCedula {
  clave: ClavePlantillaCedula;
  valor_ejemplo: string;
  confianza?: "alta" | "media" | "baja";
}

export interface AnalisisPlantillaCedula {
  modo: "ejemplo" | "placeholders";
  reemplazos: ReemplazoPlantillaCedula[];
  campos_detectados: ClavePlantillaCedula[];
  resumen?: string;
}

export interface PlantillaCedulaUsuario {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  storage_path: string;
  nombre_archivo: string;
  mime_type: string;
  tamano_bytes: number;
  analisis_ia: AnalisisPlantillaCedula | null;
  created_at: string;
  updated_at: string;
}

export const LABEL_CAMPO_PLANTILLA: Record<ClavePlantillaCedula, string> = {
  tribunal: "Tribunal / juzgado",
  caratula: "Carátula",
  numero_expediente: "Nº expediente",
  jurisdiccion: "Jurisdicción",
  destinatario: "Destinatario",
  domicilio: "Domicilio",
  texto_resolucion: "Texto del proveído",
  fecha: "Fecha",
  abogado: "Letrado",
  matricula: "Matrícula",
  ciudad: "Ciudad",
  provincia: "Provincia",
};
