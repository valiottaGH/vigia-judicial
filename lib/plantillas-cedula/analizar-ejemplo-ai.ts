import { createChatCompletion } from "@/lib/ai/chat";
import { VARIABLES_PLANTILLA_DOCX } from "./constants";
import type { AnalisisPlantillaCedula, ClavePlantillaCedula, ReemplazoPlantillaCedula } from "./types";

const CLAVES_VALIDAS = new Set<string>(
  VARIABLES_PLANTILLA_DOCX.map((v) => v.key)
);

function parseAnalisis(raw: string): AnalisisPlantillaCedula {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("La IA no devolvió un análisis válido. Intentá de nuevo.");
  }

  const obj = parsed as Record<string, unknown>;
  const reemplazosRaw = Array.isArray(obj.reemplazos) ? obj.reemplazos : [];

  const reemplazos = reemplazosRaw
    .map((item) => {
      const r = item as Record<string, unknown>;
      const clave = String(r.clave ?? "").trim();
      const valor_ejemplo = String(r.valor_ejemplo ?? "").trim();
      if (!CLAVES_VALIDAS.has(clave) || !valor_ejemplo) return null;
      return {
        clave: clave as ClavePlantillaCedula,
        valor_ejemplo,
        confianza:
          r.confianza === "alta" || r.confianza === "media" || r.confianza === "baja"
            ? r.confianza
            : undefined,
      } satisfies ReemplazoPlantillaCedula;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (reemplazos.length === 0) {
    throw new Error(
      "No pudimos detectar datos variables en la cédula de ejemplo. Probá con otra cédula ya completada."
    );
  }

  const campos_detectados = [
    ...new Set(reemplazos.map((r) => r.clave)),
  ] as ClavePlantillaCedula[];

  return {
    modo: "ejemplo",
    reemplazos,
    campos_detectados,
    resumen:
      typeof obj.resumen === "string" && obj.resumen.trim()
        ? obj.resumen.trim()
        : `Modelo con ${campos_detectados.length} campo(s) detectado(s)`,
  };
}

function detectarModoPlaceholders(texto: string): AnalisisPlantillaCedula | null {
  const tienePlaceholder = VARIABLES_PLANTILLA_DOCX.some((v) =>
    texto.includes(`{${v.key}}`)
  );
  if (!tienePlaceholder) return null;

  return {
    modo: "placeholders",
    reemplazos: [],
    campos_detectados: VARIABLES_PLANTILLA_DOCX.filter((v) =>
      texto.includes(`{${v.key}}`)
    ).map((v) => v.key),
    resumen: "Plantilla con variables entre llaves (modo avanzado)",
  };
}

/** Analiza una cédula de ejemplo y detecta qué fragmentos son datos variables. */
export async function analizarCedulaEjemplo(
  textoDocumento: string
): Promise<AnalisisPlantillaCedula> {
  const placeholder = detectarModoPlaceholders(textoDocumento);
  if (placeholder) return placeholder;

  const clavesDesc = VARIABLES_PLANTILLA_DOCX.map(
    (v) => `- ${v.key}: ${v.label}`
  ).join("\n");

  const raw = await createChatCompletion({
    jsonMode: true,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `Sos un asistente jurídico argentino. Analizás cédulas/oficios de ejemplo para detectar qué partes del texto son datos que cambian entre un trámite y otro.

Claves posibles:
${clavesDesc}

Respondé SOLO JSON con esta forma:
{
  "reemplazos": [
    { "clave": "destinatario", "valor_ejemplo": "texto EXACTO del documento", "confianza": "alta" }
  ],
  "resumen": "breve descripción del tipo de cédula"
}

Reglas:
- valor_ejemplo debe copiarse TAL CUAL aparece en el documento (mayúsculas, puntuación, espacios).
- Solo incluí claves donde hay un valor concreto identificable en el ejemplo.
- Para texto_resolucion, incluí el bloque del proveído/resolución notificada (puede ser largo).
- No inventes datos que no estén en el documento.
- Priorizá destinatario, domicilio, numero_expediente, caratula, tribunal, texto_resolucion, abogado, matricula, fecha.`,
      },
      {
        role: "user",
        content: `Analizá esta cédula de ejemplo:\n\n${textoDocumento.slice(0, 12000)}`,
      },
    ],
  });

  return parseAnalisis(raw);
}
