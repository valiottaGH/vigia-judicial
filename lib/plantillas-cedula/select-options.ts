import { JURISDICCIONES_ESCRIITO } from "@/lib/jurisdicciones/options";
import { USER_PLANTILLA_PREFIX } from "./constants";
import type { PlantillaCedulaUsuario } from "./types";
import type { PreparacionEscrito } from "@/lib/cedulas/preparar-escrito";

export function plantillaKeyFromUserId(id: string): string {
  return `${USER_PLANTILLA_PREFIX}${id}`;
}

export function parsePlantillaSeleccion(
  value?: string | null
): { type: "system"; key: string } | { type: "user"; id: string } | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith(USER_PLANTILLA_PREFIX)) {
    const id = trimmed.slice(USER_PLANTILLA_PREFIX.length);
    if (!id) return null;
    return { type: "user", id };
  }
  return { type: "system", key: trimmed };
}

export function isUserPlantillaKey(value?: string | null): boolean {
  return Boolean(value?.trim().startsWith(USER_PLANTILLA_PREFIX));
}

export function buildOpcionesPlantilla(
  plantillasUsuario: PlantillaCedulaUsuario[]
): Array<{ value: string; label: string }> {
  const opciones: Array<{ value: string; label: string }> =
    JURISDICCIONES_ESCRIITO.map((j) => ({
      value: j.value,
      label: j.label,
    }));

  if (plantillasUsuario.length > 0) {
    for (const p of plantillasUsuario) {
      opciones.push({
        value: plantillaKeyFromUserId(p.id),
        label: `Mi modelo: ${p.nombre}`,
      });
    }
  }

  return opciones;
}

/** Agrega las plantillas del usuario al selector de jurisdicción/modelo. */
export function injectPlantillasUsuarioEnPreparacion(
  preparacion: PreparacionEscrito,
  plantillasUsuario: PlantillaCedulaUsuario[]
): PreparacionEscrito {
  if (plantillasUsuario.length === 0) return preparacion;

  const opciones = buildOpcionesPlantilla(plantillasUsuario);

  return {
    ...preparacion,
    preguntas: preparacion.preguntas.map((p) =>
      p.id === "jurisdiccion_plantilla"
        ? {
            ...p,
            pregunta:
              "Modelo de cédula/oficio: provincial del sistema o tu plantilla DOCX",
            motivo:
              "Podés usar un modelo provincial o una plantilla propia que hayas cargado en Configuración.",
            opciones,
          }
        : p
    ),
  };
}
