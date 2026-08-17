import type { PlantillaVariables } from "@/lib/jurisdicciones/types";
import { mergePlantillaDocxPlaceholders } from "./merge-placeholders";
import { reemplazarEnDocxEjemplo } from "./reemplazar-en-docx";
import type { AnalisisPlantillaCedula } from "./types";
import { PlantillaCedulaError } from "./storage";

/** Completa una plantilla del usuario según su modo (ejemplo analizado por IA o placeholders). */
export function mergePlantillaDocx(
  templateBuffer: Uint8Array,
  variables: PlantillaVariables,
  analisisIa?: AnalisisPlantillaCedula | null
): Uint8Array {
  if (analisisIa?.modo === "ejemplo") {
    return reemplazarEnDocxEjemplo(templateBuffer, analisisIa, variables);
  }

  if (analisisIa?.modo === "placeholders") {
    return mergePlantillaDocxPlaceholders(templateBuffer, variables);
  }

  // Plantillas legacy sin análisis: intentar placeholders y luego ejemplo vacío
  try {
    return mergePlantillaDocxPlaceholders(templateBuffer, variables);
  } catch {
    throw new PlantillaCedulaError(
      "Esta plantilla no fue analizada. Volvé a subirla como cédula de ejemplo.",
      "STORAGE"
    );
  }
}
