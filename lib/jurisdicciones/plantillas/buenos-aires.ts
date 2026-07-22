import type { JurisdictionTemplate } from "../types";
import { defaultTemplate } from "./default";

/** Buenos Aires: terminología y formato propios de PBA. */
export const buenosAiresTemplate: JurisdictionTemplate = {
  ...defaultTemplate,
  key: "buenos-aires",
  nombre: "Provincia de Buenos Aires",

  generateCedula(v) {
    const doc = defaultTemplate.generateCedula(v);
    return {
      ...doc,
      cuerpo: doc.cuerpo.replace(
        "CÉDULA DE NOTIFICACIÓN",
        "CÉDULA DE NOTIFICACIÓN — PBA"
      ),
    };
  },
};
