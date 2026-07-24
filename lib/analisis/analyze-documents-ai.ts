import { createChatCompletion } from "@/lib/ai/chat";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import type { CampoExtraccion, CeldaAnalisis, FilaAnalisis, ResultadoAnalisis } from "./types";

export { isAiConfigured, aiConfigErrorMessage };

export interface DocumentoParaAnalisis {
  adjunto_id: string;
  nombre: string;
  texto: string;
}

function buildSystemPrompt(campos: CampoExtraccion[]): string {
  return [
    "Sos un asistente jurídico para abogados en Argentina.",
    "Extraés información estructurada de documentos legales (expedientes, contratos, resoluciones, escritos).",
    "Para CADA campo solicitado devolvé un objeto con:",
    '- "valor": la información extraída de forma clara y concisa (o "No encontrado" si no está en el documento)',
    '- "cita": cita textual breve del documento que respalda el valor (máx. 300 caracteres, texto literal)',
    "Respondé SOLO JSON válido.",
    "",
    "Campos a extraer:",
    ...campos.map((c) => `- ${c.id}: ${c.label} — ${c.descripcion}`),
  ].join("\n");
}

function buildUserPrompt(doc: DocumentoParaAnalisis, campos: CampoExtraccion[]): string {
  const fieldKeys = campos.map((c) => `"${c.id}": { "valor": "...", "cita": "..." }`).join(",\n  ");

  return `Documento: ${doc.nombre}

Texto:
---
${doc.texto}
---

Devolvé JSON con esta forma:
{
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

  return {
    documento: doc.nombre,
    adjunto_id: doc.adjunto_id,
    celdas: parseCeldas(parsed, campos),
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
        });
      }
    }
  }

  let resumen: string | null = null;
  if (filas.length > 0) {
    try {
      const overview = filas
        .map(
          (f) =>
            `- ${f.documento}: ${Object.entries(f.celdas)
              .slice(0, 3)
              .map(([k, v]) => `${k}=${v.valor}`)
              .join("; ")}`
        )
        .join("\n");

      resumen = await createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "Sos un abogado. Resumí en 3-5 oraciones los hallazgos principales del lote de documentos analizados.",
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
