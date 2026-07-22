import type { InterpretacionNotificacion, ParteInterpretada } from "./types";
import type { RolParte, TipoActuacion } from "@/lib/actuaciones/types";
import { createChatCompletion } from "@/lib/ai/chat";

const TIPOS_DOC_VALIDOS = [
  "cedula",
  "oficio",
  "mandamiento",
  "notificacion_electronica",
  "carta_documento",
] as const;

function buildSystemPrompt(): string {
  return [
    "Sos un asistente jurídico para abogados en Argentina.",
    "Analizás notificaciones/proveídos judiciales y determinás qué documento debe generar el letrado para cumplir o dar respuesta.",
    "Respondé SOLO JSON válido.",
    "Tipos de trámite frecuentes: peritos, notificar_partes, liquidacion, traslado, vista_causa, otras.",
    "tipo_documento puede ser: cedula (notificar resolución a partes), oficio, mandamiento, notificacion_electronica, carta_documento (intimación extrajudicial fehaciente).",
    "texto_proveido: extracto fiel de lo ordenado por el tribunal.",
    "texto_respuesta: redacción formal lista para insertar en la cédula/carta (cumplimiento, solicitud, intimación, etc.).",
    "partes: personas u organismos a notificar con rol actor|demandado|tercero|organismo.",
    "Si el abogado envía instrucciones adicionales, incorporalas en texto_respuesta, partes y variables_carta sin contradecir el proveído.",
  ].join("\n");
}

function buildUserPrompt(input: {
  numeroExpediente: string;
  caratula: string;
  documentoTexto: string;
  especificaciones?: string;
}): string {
  const instrucciones = input.especificaciones?.trim()
    ? `

Instrucciones del abogado (incorporar en la redacción y destinatarios cuando corresponda):
---
${input.especificaciones.trim()}
---`
    : "";

  return `Expediente Nº ${input.numeroExpediente}
Carátula: ${input.caratula}

Texto del proveído / notificación judicial:
---
${input.documentoTexto}
---${instrucciones}

Devolvé JSON:
{
  "tipo_tramite": "peritos | notificar_partes | liquidacion | ...",
  "tipo_documento": "cedula | oficio | mandamiento | notificacion_electronica | carta_documento",
  "resumen": "una oración",
  "texto_proveido": "texto del proveído",
  "texto_respuesta": "cuerpo de la respuesta para el documento",
  "fecha_resolucion": "YYYY-MM-DD o null",
  "juzgado": "nombre del juzgado o null",
  "jurisdiccion": "provincia o null",
  "partes": [
    { "nombre": "Juan", "apellido": "Pérez", "rol": "demandado", "domicilio": "...", "notificar": true }
  ],
  "variables_carta": { "destinatario": "...", "domicilio_destinatario": "...", "monto": "...", "concepto": "...", "plazo": "..." }
}`;
}

function parseParte(raw: Record<string, unknown>): ParteInterpretada | null {
  const nombre = String(raw.nombre ?? "").trim();
  const apellido = String(raw.apellido ?? "").trim();
  if (!nombre && !apellido) return null;

  const rolRaw = String(raw.rol ?? "tercero").toLowerCase();
  const rol: RolParte =
    rolRaw === "actor" ||
    rolRaw === "demandado" ||
    rolRaw === "organismo" ||
    rolRaw === "tercero"
      ? rolRaw
      : "tercero";

  return {
    nombre: nombre || "Sin nombre",
    apellido: apellido || "Sin apellido",
    rol,
    domicilio: raw.domicilio ? String(raw.domicilio) : null,
    notificar: raw.notificar !== false,
  };
}

function normalizeInterpretacion(
  raw: Record<string, unknown>
): InterpretacionNotificacion {
  const tipoDoc = String(raw.tipo_documento ?? "cedula").toLowerCase();
  const tipo_documento = (
    TIPOS_DOC_VALIDOS.includes(tipoDoc as (typeof TIPOS_DOC_VALIDOS)[number])
      ? tipoDoc
      : "cedula"
  ) as InterpretacionNotificacion["tipo_documento"];

  const partes = Array.isArray(raw.partes)
    ? raw.partes
        .map((p) => parseParte(p as Record<string, unknown>))
        .filter((p): p is ParteInterpretada => p !== null)
    : [];

  const vars = raw.variables_carta as Record<string, unknown> | undefined;

  return {
    tipo_tramite: String(raw.tipo_tramite ?? "otras"),
    tipo_documento,
    resumen: String(raw.resumen ?? "Trámite judicial detectado"),
    texto_proveido: String(raw.texto_proveido ?? "").trim() || "[Proveído no identificado]",
    texto_respuesta: String(raw.texto_respuesta ?? "").trim() || "[Completar respuesta]",
    fecha_resolucion: raw.fecha_resolucion
      ? String(raw.fecha_resolucion).slice(0, 10)
      : null,
    juzgado: raw.juzgado ? String(raw.juzgado) : null,
    jurisdiccion: raw.jurisdiccion ? String(raw.jurisdiccion) : null,
    partes,
    variables_carta: vars
      ? {
          destinatario: vars.destinatario ? String(vars.destinatario) : undefined,
          domicilio_destinatario: vars.domicilio_destinatario
            ? String(vars.domicilio_destinatario)
            : undefined,
          monto: vars.monto ? String(vars.monto) : undefined,
          concepto: vars.concepto ? String(vars.concepto) : undefined,
          plazo: vars.plazo ? String(vars.plazo) : undefined,
        }
      : undefined,
  };
}

export async function interpretarNotificacion(input: {
  numeroExpediente: string;
  caratula: string;
  documentoTexto: string;
  especificaciones?: string;
}): Promise<InterpretacionNotificacion> {
  if (!input.documentoTexto.trim()) {
    throw new Error("No se pudo leer texto del documento cargado.");
  }

  const content = await createChatCompletion({
    jsonMode: true,
    temperature: 0.15,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error("La IA devolvió un formato inválido");
  }

  return normalizeInterpretacion(parsed);
}

export function mapTipoActuacion(
  tipo: InterpretacionNotificacion["tipo_documento"]
): TipoActuacion {
  if (tipo === "carta_documento") return "cedula";
  return tipo;
}
