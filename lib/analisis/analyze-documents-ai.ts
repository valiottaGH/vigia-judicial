import { createChatCompletion } from "@/lib/ai/chat";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import type { CampoExtraccion, CeldaAnalisis, FilaAnalisis, ResultadoAnalisis } from "./types";
import { parseTramiteDetectado } from "./tramite-detectado";

export { isAiConfigured, aiConfigErrorMessage };

export interface DocumentoParaAnalisis {
  adjunto_id: string;
  nombre: string;
  texto: string;
}

function buildSystemPrompt(campos: CampoExtraccion[]): string {
  return [
    "Sos un asistente jurídico para abogados en Argentina.",
    "Analizás documentos de expedientes judiciales y extraés datos estructurados.",
    "",
    "PASO 1 — Determiná si el documento exige una ACCIÓN PROCESAL del letrado",
    "(redactar cédula, oficio, mandamiento, presentar escrito, notificar, etc.).",
    "- requiere_escrito=true solo si hay proveído, notificación judicial, traslado,",
    "  vista, liquidación u orden que el abogado deba cumplir o comunicar.",
    "- requiere_escrito=false si es: mero archivo, contrato sin orden judicial,",
    "  recibo, noticia, documento ilegible, copia informativa sin plazo ni orden,",
    "  o cualquier texto donde no corresponda redactar respuesta procesal.",
    "- Cuando requiere_escrito=false, motivo_sin_escrito debe decir claramente",
    '  "No hay escrito ni respuesta procesal que realizar" y explicar por qué.',
    "",
    "PASO 2 — Si requiere_escrito=true, sugerí:",
    "- tipo_tramite: peritos | notificar_partes | traslado | liquidacion | vista_causa | otras",
    "- tipo_documento_sugerido: cedula | oficio | mandamiento",
    "- descripcion: una oración del trámite pendiente",
    "",
    "PASO 3 — Extraé los campos solicitados con valor y cita textual.",
    "",
    "Campos a extraer:",
    ...campos.map((c) => `- ${c.id}: ${c.label} — ${c.descripcion}`),
    "",
    "Respondé SOLO JSON válido.",
  ].join("\n");
}

function buildUserPrompt(doc: DocumentoParaAnalisis, campos: CampoExtraccion[]): string {
  const fieldKeys = campos.map((c) => `"${c.id}": { "valor": "...", "cita": "..." }`).join(",\n  ");

  return `Documento: ${doc.nombre}

Texto:
---
${doc.texto}
---

Devolvé JSON:
{
  "tramite": {
    "requiere_escrito": true,
    "tipo_tramite": "notificar_partes",
    "tipo_documento_sugerido": "cedula",
    "descripcion": "Notificar traslado de la demanda a la contraria",
    "motivo_sin_escrito": null
  },
  "celdas": {
  ${fieldKeys}
  }
}`;
}

function parseCeldas(
  raw: unknown,
  campos: CampoExtraccion[]
): Record<string, CeldaAnalisis> {
  const celdas: Record<string, CeldaAnalisis> = {};
  const source =
    typeof raw === "object" && raw !== null && "celdas" in raw
      ? (raw as { celdas?: Record<string, unknown> }).celdas
      : null;

  for (const campo of campos) {
    const cell = source?.[campo.id];
    if (
      typeof cell === "object" &&
      cell !== null &&
      "valor" in cell
    ) {
      const obj = cell as { valor?: unknown; cita?: unknown };
      celdas[campo.id] = {
        valor: String(obj.valor ?? "No encontrado"),
        cita: String(obj.cita ?? ""),
      };
    } else {
      celdas[campo.id] = { valor: "No encontrado", cita: "" };
    }
  }

  return celdas;
}

export async function analizarUnDocumento(
  doc: DocumentoParaAnalisis,
  campos: CampoExtraccion[]
): Promise<FilaAnalisis> {
  const content = await createChatCompletion({
    messages: [
      { role: "system", content: buildSystemPrompt(campos) },
      { role: "user", content: buildUserPrompt(doc, campos) },
    ],
    jsonMode: true,
    temperature: 0.1,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Respuesta IA inválida para ${doc.nombre}`);
  }

  const payload = parsed as { tramite?: unknown; celdas?: unknown };

  return {
    documento: doc.nombre,
    adjunto_id: doc.adjunto_id,
    celdas: parseCeldas(parsed, campos),
    tramite: parseTramiteDetectado(payload.tramite),
  };
}

export async function analizarDocumentosConIA(input: {
  documentos: DocumentoParaAnalisis[];
  campos: CampoExtraccion[];
  concurrency?: number;
}): Promise<ResultadoAnalisis> {
  const filas: FilaAnalisis[] = [];
  const lectura_errores: string[] = [];
  const limit = input.concurrency ?? 3;

  for (let i = 0; i < input.documentos.length; i += limit) {
    const batch = input.documentos.slice(i, i + limit);
    const results = await Promise.allSettled(
      batch.map((doc) => analizarUnDocumento(doc, input.campos))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const doc = batch[j];
      if (result.status === "fulfilled") {
        filas.push(result.value);
      } else {
        lectura_errores.push(
          `${doc.nombre}: ${result.reason instanceof Error ? result.reason.message : "Error de IA"}`
        );
        filas.push({
          documento: doc.nombre,
          adjunto_id: doc.adjunto_id,
          celdas: Object.fromEntries(
            input.campos.map((c) => [c.id, { valor: "Error", cita: "" }])
          ),
          tramite: {
            requiere_escrito: false,
            tipo_tramite: "ninguno",
            tipo_documento_sugerido: null,
            descripcion: "Error al analizar",
            motivo_sin_escrito: "No se pudo analizar este documento",
          },
        });
      }
    }
  }

  let resumen: string | null = null;
  if (filas.length > 0) {
    try {
      const overview = filas
        .map((f) => {
          const tr = f.tramite;
          const tramiteInfo = tr
            ? tr.requiere_escrito
              ? `TRÁMITE: ${tr.descripcion} (${tr.tipo_documento_sugerido})`
              : `SIN ESCRITO: ${tr.motivo_sin_escrito}`
            : "";
          return `- ${f.documento}: ${tramiteInfo}`;
        })
        .join("\n");

      resumen = await createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "Sos un abogado. Resumí en 3-5 oraciones los hallazgos del lote, indicando cuáles documentos requieren acción procesal y cuáles no.",
          },
          { role: "user", content: overview },
        ],
        temperature: 0.2,
      });
    } catch {
      resumen = null;
    }
  }

  return { filas, resumen, lectura_errores };
}
