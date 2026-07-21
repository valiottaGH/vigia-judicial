/**
 * Generacion de borradores via OpenAI Chat Completions.
 * Requiere OPENAI_API_KEY — ver docs/ESCRITOS-IA.md
 */
import { getPlantilla } from "./plantillas";
import type { MembreteProfile } from "@/types";

export interface GenerarEscritoInput {
  tipo: string;
  instrucciones: string;
  variables?: Record<string, string>;
  membrete?: MembreteProfile | null;
}

function buildSystemPrompt(tipo: string, membrete?: MembreteProfile | null): string {
  const plantilla = getPlantilla(tipo);
  return [
    "Sos un asistente de redaccion para abogados en Argentina (Provincia de Santa Fe).",
    "Genera SOLO el cuerpo del escrito en HTML simple: etiquetas <p> y <strong> unicamente.",
    "No uses markdown, no uses ```, no agregues explicaciones fuera del escrito.",
    "Tono formal juridico. Fechas en formato largo espanol (ej. 20 de julio de 2026).",
    plantilla
      ? `Tipo de escrito: ${plantilla.nombre}. ${plantilla.descripcion}.`
      : `Tipo de escrito: ${tipo}.`,
    membrete?.full_name ? `Abogado: ${membrete.full_name}.` : "",
    membrete?.matricula ? `Matricula CPASF: ${membrete.matricula}.` : "",
    membrete?.estudio_nombre ? `Estudio: ${membrete.estudio_nombre}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildUserPrompt(input: GenerarEscritoInput): string {
  const vars = input.variables ?? {};
  const varsText = Object.entries(vars)
    .filter(([, v]) => v && !v.startsWith("["))
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return [
    "Redacta el escrito completo listo para revisar.",
    input.instrucciones.trim(),
    varsText ? `\nDatos ya conocidos:\n${varsText}` : "",
    "\nInclui encabezado con ciudad y fecha, saludo al juez, desarrollo y cierre con firma del letrado.",
  ].join("\n");
}

function sanitizeHtml(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "");
  if (!html.includes("<p>")) {
    html = html
      .split(/\n\n+/)
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");
  }
  return html;
}

export async function generarEscritoHtml(input: GenerarEscritoInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta OPENAI_API_KEY en .env.local. Ver docs/ESCRITOS-IA.md"
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: buildSystemPrompt(input.tipo, input.membrete) },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("La IA no devolvio contenido");
  }

  return sanitizeHtml(content);
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
