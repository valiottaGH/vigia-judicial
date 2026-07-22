import type { JurisdictionTemplate } from "../types";
import { defaultTemplate } from "./default";

/** Santa Fe: formato SCJ Santa Fe. */
export const santaFeTemplate: JurisdictionTemplate = {
  ...defaultTemplate,
  key: "santa-fe",
  nombre: "Provincia de Santa Fe",

  generateCedula(v) {
    const doc = defaultTemplate.generateCedula(v);
    return {
      ...doc,
      encabezado: `Suprema Corte de Justicia de Santa Fe\n${doc.encabezado ?? ""}`,
      cuerpo: doc.cuerpo.replace(
        "CÉDULA DE NOTIFICACIÓN",
        "CÉDULA DE NOTIFICACIÓN — Santa Fe"
      ),
    };
  },

  generateEscritoAcompanamiento(v) {
    const doc = defaultTemplate.generateEscritoAcompanamiento(v);
    return {
      ...doc,
      cuerpo: doc.cuerpo.replace("Será justicia.", "Será justicia.\n\nProvincia de Santa Fe."),
    };
  },
};
