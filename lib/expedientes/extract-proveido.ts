import { createChatCompletion } from "@/lib/ai/chat";
import { isAiConfigured } from "@/lib/ai/config";

/** Máximo de caracteres que reciben preparar/redactar IA. */
export const MAX_CHARS_PARA_IA = 14_000;

/** Umbral para activar extracción focalizada (no pasar PDF crudo entero). */
const UMBRAL_EXTRACCION = 12_000;

const MARCADORES_PROVEIDO = [
  /\bprov[eé]ido\b/gi,
  /\bresuelvo\b/gi,
  /\bf[ií]jese\b/gi,
  /\bnotif[ií]quese\b/gi,
  /\bcertif[ií]que\b/gi,
  /\bconsiderando\b/gi,
];

/**
 * Prepara texto para IA: en documentos largos extrae el proveído/resolución clave
 * en lugar de truncar desde el inicio del PDF.
 */
export async function prepararTextoParaIA(textoCompleto: string): Promise<{
  texto: string;
  extraccion: "completo" | "heuristica" | "ia" | "cola";
  charsOriginales: number;
}> {
  const cleaned = textoCompleto.replace(/\s+/g, " ").trim();
  const charsOriginales = cleaned.length;

  if (charsOriginales <= UMBRAL_EXTRACCION) {
    return { texto: cleaned, extraccion: "completo", charsOriginales };
  }

  const heuristico = extraerProveidoHeuristico(cleaned);
  if (heuristico.length <= MAX_CHARS_PARA_IA && heuristico.length < cleaned.length * 0.85) {
    return { texto: heuristico, extraccion: "heuristica", charsOriginales };
  }

  if (isAiConfigured()) {
    try {
      const ia = await extraerProveidoConIA(cleaned);
      if (ia.trim()) {
        return {
          texto: ia.slice(0, MAX_CHARS_PARA_IA),
          extraccion: "ia",
          charsOriginales,
        };
      }
    } catch {
      // fallback abajo
    }
  }

  const cola = cleaned.slice(-MAX_CHARS_PARA_IA);
  return { texto: cola, extraccion: "cola", charsOriginales };
}

function extraerProveidoHeuristico(texto: string): string {
  let mejorInicio = -1;

  for (const re of MARCADORES_PROVEIDO) {
    const flags = re.flags;
    const source = re.source;
    const globalRe = new RegExp(source, flags.includes("g") ? flags : `${flags}g`);
    let match: RegExpExecArray | null;
    while ((match = globalRe.exec(texto)) !== null) {
      if (match.index > mejorInicio) {
        mejorInicio = match.index;
      }
    }
  }

  if (mejorInicio >= 0) {
    const ventana = texto.slice(mejorInicio, mejorInicio + MAX_CHARS_PARA_IA);
    if (ventana.length >= 500) return ventana;
  }

  return texto.slice(-MAX_CHARS_PARA_IA);
}

async function extraerProveidoConIA(texto: string): Promise<string> {
  const muestra =
    texto.length > 80_000
      ? `${texto.slice(0, 20_000)}\n\n[...]\n\n${texto.slice(-60_000)}`
      : texto;

  const content = await createChatCompletion({
    temperature: 0.05,
    messages: [
      {
        role: "system",
        content: [
          "Sos un asistente jurídico. Del texto judicial recibido, extraé ÚNICAMENTE:",
          "el último proveído, resolución, auto o notificación que ordena un trámite al letrado.",
          "Incluí juzgado, partes mencionadas y la transcripción fiel de lo ordenado.",
          "Devolvé texto plano en español, sin JSON ni comentarios.",
          "Si hay varios proveídos, quedate con el más reciente o el que exige acción inmediata.",
        ].join("\n"),
      },
      { role: "user", content: muestra },
    ],
  });

  return content.trim();
}

export function labelExtraccion(
  tipo: "completo" | "heuristica" | "ia" | "cola",
  charsOriginales: number
): string {
  if (tipo === "completo") return "Documento leído íntegro.";
  if (tipo === "heuristica") {
    return `Documento extenso (${charsOriginales.toLocaleString("es-AR")} caracteres): se aisló el proveído/resolución clave.`;
  }
  if (tipo === "ia") {
    return `Documento extenso (${charsOriginales.toLocaleString("es-AR")} caracteres): la IA extrajo el trámite relevante.`;
  }
  return `Documento muy extenso: se analizó la parte final (${MAX_CHARS_PARA_IA.toLocaleString("es-AR")} caracteres).`;
}
