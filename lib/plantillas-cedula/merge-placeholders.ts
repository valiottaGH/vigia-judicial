import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { PlantillaVariables } from "@/lib/jurisdicciones/types";
import { PlantillaCedulaError } from "./storage";

/** Modo avanzado: plantilla DOCX con {variables} entre llaves. */
export function mergePlantillaDocxPlaceholders(
  templateBuffer: Uint8Array,
  variables: PlantillaVariables
): Uint8Array {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      tribunal: variables.tribunal,
      caratula: variables.caratula,
      numero_expediente: variables.numero_expediente,
      jurisdiccion: variables.jurisdiccion,
      destinatario: variables.destinatario,
      domicilio: variables.domicilio,
      texto_resolucion: variables.texto_resolucion,
      fecha: variables.fecha,
      abogado: variables.abogado,
      matricula: variables.matricula,
      ciudad: variables.ciudad,
      provincia: variables.provincia,
    });

    return doc.getZip().generate({ type: "uint8array" }) as Uint8Array;
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Error desconocido al completar la plantilla";
    throw new PlantillaCedulaError(
      `No se pudo completar la plantilla DOCX: ${msg}`,
      "STORAGE"
    );
  }
}
