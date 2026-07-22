import type { DocumentoPlantilla } from "@/lib/jurisdicciones/types";
import type { JurisdictionTemplate } from "@/lib/jurisdicciones/types";
import type { PlantillaVariables } from "@/lib/jurisdicciones/types";
import type { TipoActuacion } from "./types";

type GeneratorFn = (template: JurisdictionTemplate, data: PlantillaVariables) => DocumentoPlantilla;

const GENERATORS: Record<TipoActuacion, GeneratorFn | null> = {
  cedula: (t, d) => t.generateCedula(d),
  oficio: (t, d) => t.generateOficio(d),
  mandamiento: (t, d) => t.generateMandamiento(d),
  notificacion_electronica: (t, d) => t.generateNotification(d),
  escrito_acompanamiento: null,
};

/** Genera el documento según tipo y plantilla jurisdiccional. */
export function renderDocumento(
  tipo: TipoActuacion,
  template: JurisdictionTemplate,
  variables: PlantillaVariables
): DocumentoPlantilla {
  if (tipo === "escrito_acompanamiento") {
    throw new Error("Use renderEscritoAcompanamiento para este tipo");
  }

  const gen = GENERATORS[tipo];
  if (!gen) {
    throw new Error(`Tipo de actuación sin generador: ${tipo}`);
  }

  return gen(template, variables);
}

export function renderEscritoAcompanamiento(
  template: JurisdictionTemplate,
  variables: PlantillaVariables & {
    tipo_actuacion: string;
    cantidad_documentos: number;
  }
): DocumentoPlantilla {
  return template.generateEscritoAcompanamiento(variables);
}

/** Registro extensible de tipos de actuación. */
export function registerActuacionGenerator(
  tipo: TipoActuacion,
  fn: GeneratorFn
): void {
  GENERATORS[tipo] = fn;
}

export function isTipoActuacion(value: string): value is TipoActuacion {
  return value in GENERATORS;
}
