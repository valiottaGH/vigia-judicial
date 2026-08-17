import PizZip from "pizzip";
import type { PlantillaVariables } from "@/lib/jurisdicciones/types";
import type { AnalisisPlantillaCedula, ClavePlantillaCedula } from "./types";
import { PlantillaCedulaError } from "./storage";

const XML_PARTS = /^word\/(document|header|footer|footnotes|endnotes).*\.xml$/i;

function escapeRegexChar(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Permite etiquetas XML entre caracteres (Word suele partir texto en varios <w:t>). */
function buildSplitAwarePattern(literal: string): RegExp {
  const chars = [...literal];
  if (chars.length === 0) return /(?!)/;
  const body = chars.map((c) => escapeRegexChar(c)).join("(?:<[^>]+>)*");
  return new RegExp(body, "g");
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function valorParaClave(
  clave: ClavePlantillaCedula,
  variables: PlantillaVariables
): string {
  return String(variables[clave] ?? "");
}

/**
 * Completa una cédula de ejemplo reemplazando los valores detectados por la IA,
 * preservando el formato Word original.
 */
export function reemplazarEnDocxEjemplo(
  templateBuffer: Uint8Array,
  analisis: AnalisisPlantillaCedula,
  variables: PlantillaVariables
): Uint8Array {
  if (analisis.modo !== "ejemplo" || analisis.reemplazos.length === 0) {
    throw new PlantillaCedulaError(
      "La plantilla no tiene análisis de ejemplo válido",
      "STORAGE"
    );
  }

  try {
    const zip = new PizZip(templateBuffer);
    const reemplazos = [...analisis.reemplazos].sort(
      (a, b) => b.valor_ejemplo.length - a.valor_ejemplo.length
    );

    for (const fileName of Object.keys(zip.files)) {
      if (!XML_PARTS.test(fileName)) continue;
      const file = zip.files[fileName];
      if (!file || file.dir) continue;

      let xml = file.asText();
      for (const r of reemplazos) {
        const nuevo = valorParaClave(r.clave, variables);
        if (!nuevo || !r.valor_ejemplo) continue;

        const pattern = buildSplitAwarePattern(r.valor_ejemplo);
        xml = xml.replace(pattern, escapeXmlText(nuevo));

        // Fallback: reemplazo directo por si el texto no está partido
        if (xml.includes(r.valor_ejemplo)) {
          xml = xml.split(r.valor_ejemplo).join(escapeXmlText(nuevo));
        }
      }
      zip.file(fileName, xml);
    }

    return zip.generate({ type: "uint8array" }) as Uint8Array;
  } catch (err) {
    if (err instanceof PlantillaCedulaError) throw err;
    const msg = err instanceof Error ? err.message : "Error desconocido";
    throw new PlantillaCedulaError(
      `No se pudo completar la cédula de ejemplo: ${msg}`,
      "STORAGE"
    );
  }
}
