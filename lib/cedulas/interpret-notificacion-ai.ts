import type { InterpretacionNotificacion, ParteInterpretada } from "./types";
import type { RolParte, TipoActuacion } from "@/lib/actuaciones/types";
import { createChatCompletion } from "@/lib/ai/chat";

export class DocumentoNoAptoError extends Error {
  readonly code = "DOCUMENTO_NO_APTO" as const;

  constructor(message: string) {
    super(message);
    this.name = "DocumentoNoAptoError";
  }
}

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
    "Tu ÚNICO propósito es analizar proveídos, notificaciones y resoluciones del Poder Judicial, y redactar la respuesta procesal que el letrado debe presentar o notificar.",
    "Ejemplos de trámites válidos: notificar partes, designar o aceptar peritos, contestar traslados, cumplir vistas, presentar liquidaciones, responder oficios judiciales, mandamientos, cédulas, notificaciones electrónicas.",
    "",
    "PASO 1 — Evaluá si el texto cargado es un trámite judicial real.",
    "Si el documento NO es una notificación/proveído/resolución/oficio judicial, o no permite identificar qué debe hacer el abogado en el proceso, respondé con apto=false.",
    "Rechazá (apto=false) documentos como: recetas, facturas, contratos comerciales ajenos al expediente, noticias, manuales, emails personales, currículums, contenido vacío o ilegible, material académico, protocolos internos sin orden judicial, o cualquier texto sin vínculo con un trámite judicial.",
    "",
    "PASO 2 — Solo si apto=true, completá el resto del JSON para generar la cédula u otro escrito procesal.",
    "Respondé SOLO JSON válido.",
    "Tipos de trámite frecuentes: peritos, notificar_partes, liquidacion, traslado, vista_causa, otras.",
    "tipo_documento puede ser: cedula (notificar resolución a partes), oficio, mandamiento, notificacion_electronica, carta_documento (intimación extrajudicial fehaciente vinculada al caso).",
    "texto_proveido: extracto fiel de lo ordenado por el tribunal.",
    "texto_respuesta: redacción formal lista para insertar en la cédula/carta (cumplimiento, solicitud, intimación, etc.).",
    "partes: personas u organismos a notificar con rol actor|demandado|tercero|organismo.",
    "motivo_rechazo: explicación clara y breve en español para el abogado cuando apto=false.",
  ].join("\n");
}

function buildUserPrompt(input: {
  numeroExpediente: string;
  caratula: string;
  documentoTexto: string;
}): string {
  return `Expediente Nº ${input.numeroExpediente}
Carátula: ${input.caratula}

Texto del proveído / notificación judicial:
---
${input.documentoTexto}
---

Devolvé JSON:
{
  "apto": true,
  "motivo_rechazo": null,
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
}

Si el documento NO es apto, devolvé SOLO:
{
  "apto": false,
  "motivo_rechazo": "Explicación clara de por qué no se puede generar una cédula con este archivo"
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

function isApto(raw: Record<string, unknown>): boolean {
  const value = raw.apto;
  if (value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  return true;
}

function assertDocumentoApto(raw: Record<string, unknown>): void {
  if (isApto(raw)) return;

  const motivo = String(raw.motivo_rechazo ?? raw.resumen ?? "").trim();
  throw new DocumentoNoAptoError(
    motivo ||
      "El archivo no corresponde a un trámite judicial. Cargá un proveído, notificación o resolución del juzgado que indique qué debe hacer el letrado (notificar partes, responder un traslado, designar perito, etc.)."
  );
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

  assertDocumentoApto(parsed);

  return normalizeInterpretacion(parsed);
}

export function mapTipoActuacion(
  tipo: InterpretacionNotificacion["tipo_documento"]
): TipoActuacion {
  if (tipo === "carta_documento") return "cedula";
  return tipo;
}
