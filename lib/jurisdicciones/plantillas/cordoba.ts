import type { JurisdictionTemplate } from "../types";
import { defaultTemplate } from "./default";

/** Córdoba: terminología provincial. */
export const cordobaTemplate: JurisdictionTemplate = {
  ...defaultTemplate,
  key: "cordoba",
  nombre: "Provincia de Córdoba",

  generateCedula(v) {
    const doc = defaultTemplate.generateCedula(v);
    return {
      ...doc,
      cuerpo: doc.cuerpo.replace(
        "CÉDULA DE NOTIFICACIÓN",
        "CÉDULA DE NOTIFICACIÓN — Córdoba"
      ),
    };
  },
};
