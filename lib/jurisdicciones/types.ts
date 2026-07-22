/** Variables universales que reciben todas las plantillas jurisdiccionales. */
export interface PlantillaVariables {
  tribunal: string;
  caratula: string;
  numero_expediente: string;
  jurisdiccion: string;
  destinatario: string;
  domicilio: string;
  texto_resolucion: string;
  fecha: string;
  abogado: string;
  matricula: string;
  ciudad: string;
  provincia: string;
}

/** Documento generado por una plantilla (texto plano para DOCX/PDF). */
export interface DocumentoPlantilla {
  titulo: string;
  cuerpo: string;
  encabezado?: string;
  pie?: string;
}

/** Contrato común para plantillas provinciales. */
export interface JurisdictionTemplate {
  key: string;
  nombre: string;
  generateCedula(data: PlantillaVariables): DocumentoPlantilla;
  generateOficio(data: PlantillaVariables): DocumentoPlantilla;
  generateMandamiento(data: PlantillaVariables): DocumentoPlantilla;
  generateNotification(data: PlantillaVariables): DocumentoPlantilla;
  generateEscritoAcompanamiento(
    data: PlantillaVariables & {
      tipo_actuacion: string;
      cantidad_documentos: number;
    }
  ): DocumentoPlantilla;
}
