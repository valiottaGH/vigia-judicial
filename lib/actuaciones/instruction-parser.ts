import type { ParsedInstruction, TipoActuacion } from "./types";
import { TIPOS_ACTUACION } from "./types";

function detectTipo(text: string): TipoActuacion | null {
  const t = text.toLowerCase();

  if (t.includes("cedula") || t.includes("cédula") || t.includes("notificar")) {
    return "cedula";
  }
  if (t.includes("oficio")) {
    return "oficio";
  }
  if (t.includes("mandamiento") || t.includes("intimacion") || t.includes("intimación")) {
    return "mandamiento";
  }
  if (t.includes("electronica") || t.includes("electrónica") || t.includes("email")) {
    return "notificacion_electronica";
  }
  if (t.includes("acompañamiento") || t.includes("acompanamiento") || t.includes("escrito")) {
    return "escrito_acompanamiento";
  }

  return null;
}

function detectDestinatarios(text: string): ParsedInstruction["destinatarios"] {
  const t = text.toLowerCase();

  if (t.includes("todos los demandados") || t.includes("todos demandados")) {
    return "all_demandados";
  }
  if (t.includes("todos los actores") || t.includes("todos actores")) {
    return "all_actores";
  }
  if (t.includes("todos") || t.includes("todas las partes")) {
    return "all";
  }

  return "selected";
}

function detectOrganismo(text: string): string | undefined {
  const match = text.match(
    /(?:oficio\s+(?:al|a\s+la|a)\s+)(.+?)(?:\.|$)/i
  );
  return match?.[1]?.trim();
}

function detectSubtipo(text: string): string | undefined {
  if (/intimaci[oó]n/i.test(text)) return "intimacion";
  if (/embargo/i.test(text)) return "embargo";
  return undefined;
}

/**
 * Parser de instrucciones en lenguaje natural → parámetros estructurados.
 * No usa IA; reglas determinísticas para salida tipada predecible.
 */
export function parseInstruction(text: string): ParsedInstruction {
  const trimmed = text.trim();

  return {
    tipo: detectTipo(trimmed),
    destinatarios: detectDestinatarios(trimmed),
    organismo: detectOrganismo(trimmed),
    subtipo: detectSubtipo(trimmed),
    raw: trimmed,
  };
}

/** Aplica parsed instruction sobre selección manual del usuario. */
export function mergeInstructionWithRequest(
  parsed: ParsedInstruction,
  manual: {
    tipo_actuacion: TipoActuacion;
    destinatario_ids: string[];
  }
): {
  tipo: TipoActuacion;
  useAllDemandados: boolean;
  useAllActores: boolean;
  useAll: boolean;
} {
  const tipo =
    parsed.tipo && TIPOS_ACTUACION.includes(parsed.tipo)
      ? parsed.tipo
      : manual.tipo_actuacion;

  return {
    tipo,
    useAllDemandados: parsed.destinatarios === "all_demandados",
    useAllActores: parsed.destinatarios === "all_actores",
    useAll: parsed.destinatarios === "all",
  };
}
