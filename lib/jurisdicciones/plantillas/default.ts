import type {
  DocumentoPlantilla,
  JurisdictionTemplate,
  PlantillaVariables,
} from "../types";

function formatExpediente(numero: string): string {
  return numero.trim();
}

function baseEncabezado(v: PlantillaVariables): string {
  return `${v.tribunal}\nExpediente Nº ${formatExpediente(v.numero_expediente)}\nCarátula: "${v.caratula}"\nJurisdicción: ${v.jurisdiccion}`;
}

function basePie(v: PlantillaVariables): string {
  return `${v.ciudad}, ${v.fecha}.\n\n${v.abogado}\nMatrícula: ${v.matricula}`;
}

export const defaultTemplate: JurisdictionTemplate = {
  key: "default",
  nombre: "Plantilla general (Argentina)",

  generateCedula(v: PlantillaVariables): DocumentoPlantilla {
    return {
      titulo: "Cédula de notificación",
      encabezado: baseEncabezado(v),
      cuerpo: [
        `CÉDULA DE NOTIFICACIÓN`,
        ``,
        `Señor/a: ${v.destinatario}`,
        `Domicilio: ${v.domicilio || "A determinar"}`,
        ``,
        `En autos caratulados "${v.caratula}", Expediente Nº ${formatExpediente(v.numero_expediente)},`,
        `y en virtud de lo dispuesto en autos, NOTIFÍQUESE a Ud. el siguiente proveído/resolución:`,
        ``,
        v.texto_resolucion,
        ``,
        `Queda Ud. debidamente notificado/a.`,
      ].join("\n"),
      pie: basePie(v),
    };
  },

  generateOficio(v: PlantillaVariables): DocumentoPlantilla {
    return {
      titulo: "Oficio judicial",
      encabezado: baseEncabezado(v),
      cuerpo: [
        `OFICIO`,
        ``,
        `Destinatario: ${v.destinatario}`,
        `Domicilio: ${v.domicilio || "A determinar"}`,
        ``,
        `En autos caratulados "${v.caratula}", Expediente Nº ${formatExpediente(v.numero_expediente)},`,
        `sírvase ${v.destinatario} tomar debida intervención en relación a lo siguiente:`,
        ``,
        v.texto_resolucion,
      ].join("\n"),
      pie: basePie(v),
    };
  },

  generateMandamiento(v: PlantillaVariables): DocumentoPlantilla {
    return {
      titulo: "Mandamiento judicial",
      encabezado: baseEncabezado(v),
      cuerpo: [
        `MANDAMIENTO`,
        ``,
        `Al Sr/a Oficial de Justicia:`,
        ``,
        `En autos caratulados "${v.caratula}", Expediente Nº ${formatExpediente(v.numero_expediente)},`,
        `líbrese mandamiento a fin de intimar a ${v.destinatario}, con domicilio en ${v.domicilio || "domicilio denunciado en autos"},`,
        `conforme a lo siguiente:`,
        ``,
        v.texto_resolucion,
      ].join("\n"),
      pie: basePie(v),
    };
  },

  generateNotification(v: PlantillaVariables): DocumentoPlantilla {
    return {
      titulo: "Notificación electrónica",
      encabezado: baseEncabezado(v),
      cuerpo: [
        `NOTIFICACIÓN ELECTRÓNICA`,
        ``,
        `Destinatario: ${v.destinatario}`,
        `Domicilio electrónico / constituido: ${v.domicilio || "Según autos"}`,
        ``,
        `En autos caratulados "${v.caratula}", Expediente Nº ${formatExpediente(v.numero_expediente)},`,
        `NOTIFÍQUESE electrónicamente el siguiente proveído/resolución:`,
        ``,
        v.texto_resolucion,
      ].join("\n"),
      pie: basePie(v),
    };
  },

  generateEscritoAcompanamiento(
    v: PlantillaVariables & { tipo_actuacion: string; cantidad_documentos: number }
  ): DocumentoPlantilla {
    return {
      titulo: "Escrito de acompañamiento",
      encabezado: baseEncabezado(v),
      cuerpo: [
        `Señor/a Juez/a:`,
        ``,
        `Me dirijo a V.S. en los autos caratulados "${v.caratula}", Expediente Nº ${formatExpediente(v.numero_expediente)},`,
        `a fin de acompañar ${v.cantidad_documentos} documento(s) de tipo "${v.tipo_actuacion}"`,
        `correspondientes a la resolución de fecha ${v.fecha}.`,
        ``,
        `Por ello, solicito se tengan por acompañados los documentos adjuntos y se provea lo que en derecho corresponda.`,
        ``,
        `Será justicia.`,
      ].join("\n"),
      pie: basePie(v),
    };
  },
};
