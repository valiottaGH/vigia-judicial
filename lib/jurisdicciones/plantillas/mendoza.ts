import type { JurisdictionTemplate } from "../types";
import { defaultTemplate } from "./default";

/** Mendoza: terminología provincial. */
export const mendozaTemplate: JurisdictionTemplate = {
  ...defaultTemplate,
  key: "mendoza",
  nombre: "Provincia de Mendoza",

  generateCedula(v) {
    const doc = defaultTemplate.generateCedula(v);
    return {
      ...doc,
      cuerpo: doc.cuerpo.replace(
        "CÉDULA DE NOTIFICACIÓN",
        "CÉDULA DE NOTIFICACIÓN — Mendoza"
      ),
    };
  },
};
