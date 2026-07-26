/** Opciones de jurisdicción para plantillas de escrito (modelos por provincia/CABA). */
export const JURISDICCIONES_ESCRIITO = [
  { value: "santa-fe", label: "Santa Fe" },
  { value: "buenos-aires", label: "Provincia de Buenos Aires" },
  { value: "caba", label: "CABA / Justicia Nacional" },
  { value: "cordoba", label: "Córdoba" },
  { value: "mendoza", label: "Mendoza" },
  { value: "default", label: "Modelo general (Argentina)" },
] as const;

export function labelJurisdiccionFromKey(key: string): string {
  const found = JURISDICCIONES_ESCRIITO.find((j) => j.value === key);
  return found?.label ?? key;
}

/** Convierte la clave elegida en el paso 2 al texto guardado en expediente.jurisdiccion. */
export function jurisdiccionLabelDesdeKey(key?: string | null): string | null {
  if (!key?.trim()) return null;
  return labelJurisdiccionFromKey(key.trim());
}

export function sugerirJurisdiccionKey(texto?: string | null): string {
  if (!texto) return "santa-fe";
  const n = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (n.includes("santa fe")) return "santa-fe";
  if (
    n.includes("caba") ||
    n.includes("capital federal") ||
    n.includes("justicia nacional") ||
    n.includes("ciudad autonoma")
  )
    return "caba";
  if (n.includes("buenos aires") || n === "pba") return "buenos-aires";
  if (n.includes("cordoba")) return "cordoba";
  if (n.includes("mendoza")) return "mendoza";
  return "default";
}
