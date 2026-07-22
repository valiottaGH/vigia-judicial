import type { JurisdictionTemplate } from "./types";
import { buenosAiresTemplate } from "./plantillas/buenos-aires";
import { cordobaTemplate } from "./plantillas/cordoba";
import { defaultTemplate } from "./plantillas/default";
import { mendozaTemplate } from "./plantillas/mendoza";
import { santaFeTemplate } from "./plantillas/santa-fe";

const REGISTRY: Record<string, JurisdictionTemplate> = {
  default: defaultTemplate,
  "buenos-aires": buenosAiresTemplate,
  "santa-fe": santaFeTemplate,
  cordoba: cordobaTemplate,
  mendoza: mendozaTemplate,
};

/** Normaliza el texto de jurisdicción del expediente a una clave de plantilla. */
export function normalizeJurisdiccionKey(jurisdiccion: string): string {
  const n = jurisdiccion
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (n.includes("santa fe")) return "santa-fe";
  if (n.includes("buenos aires") || n === "pba") return "buenos-aires";
  if (n.includes("cordoba")) return "cordoba";
  if (n.includes("mendoza")) return "mendoza";
  if (n.includes("caba") || n.includes("capital federal")) return "buenos-aires";

  return "default";
}

export function getJurisdictionTemplate(
  jurisdiccion: string
): JurisdictionTemplate {
  const key = normalizeJurisdiccionKey(jurisdiccion);
  return REGISTRY[key] ?? defaultTemplate;
}

export function listJurisdictionTemplates(): JurisdictionTemplate[] {
  return Object.values(REGISTRY);
}

export { REGISTRY as jurisdictionRegistry };
