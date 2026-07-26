import { createChatCompletion } from "@/lib/ai/chat";
import type { DocumentoSolicitado } from "./documento-solicitado";
import {
  DocumentoNoAptoError,
  isAptoFromRaw,
} from "./interpret-notificacion-ai";
import { mergePreparacionPreguntas } from "./preguntas-escrito";
import type {
  DatosExtraidosEscrito,
  PerfilEscritoResumen,
  PreparacionEscrito,
  PreguntaEscrito,
} from "./preparar-escrito";

function buildSystemPrompt(): string {
  return [
    "Sos un asistente jurídico para abogados en Argentina.",
    "Tu tarea es LEER un proveído o notificación judicial y extraer lo que consta en el expediente.",
    "NO redactes el escrito. NO preguntes objetivo del abogado ni argumentos (eso lo define el letrado en otro paso).",
    "",
    "PASO 1 — Evaluá si el documento es un trámite judicial real.",
    "Si NO lo es, respondé apto=false.",
    "",
    "PASO 2 — Extraé del proveído/resolución:",
    "- juzgado, jurisdicción, carátula, número de expediente si consta, fecha",
    "- transcripcion_auto: transcripción fiel del auto/resolución u orden del juez (texto completo relevante)",
    "- parte_a_notificar: nombre de la persona u organismo a notificar (si aplica)",
    "- partes con rol y domicilio si consta, tipo de trámite",
    "",
    "PASO 3 — Opcional: preguntas_logistica SOLO para datos de terceros (banco, registro, entidad)",
    "que el proveído ordena contactar pero cuyos datos NO están en el documento.",
    "Máximo 2 preguntas logísticas. categoria siempre 'logistica'.",
    "",
    "Respondé SOLO JSON válido.",
  ].join("\n");
}

function buildUserPrompt(input: {
  numeroExpediente: string;
  caratula: string;
  documentoTexto: string;
  contextoAnalisis?: string;
}): string {
  const contexto = input.contextoAnalisis
    ? `\n\nDatos del análisis previo:\n${input.contextoAnalisis}\n`
    : "";

  return `Expediente Nº ${input.numeroExpediente}
Carátula: ${input.caratula}
${contexto}
Texto del proveído / notificación:
---
${input.documentoTexto}
---

Devolvé JSON:
{
  "apto": true,
  "motivo_rechazo": null,
  "resumen": "Qué ordena el tribunal y qué implica para el letrado",
  "tipo_tramite": "peritos | notificar_partes | liquidacion | traslado | ...",
  "tipo_documento_sugerido": "cedula | oficio | mandamiento | liquidacion_honorarios",
  "datos_extraidos": {
    "juzgado": "...",
    "jurisdiccion": "...",
    "caratula": "...",
    "numero_expediente": "...",
    "fecha_resolucion": "YYYY-MM-DD o null",
    "texto_proveido": "resumen breve del proveído",
    "transcripcion_auto": "transcripción fiel del auto/resolución u orden del juez",
    "parte_a_notificar": "nombre de la parte a notificar o null",
    "partes": [{ "nombre": "...", "apellido": "...", "rol": "...", "domicilio": "..." }]
  },
  "preguntas_logistica": [
    {
      "id": "entidad_banco",
      "categoria": "logistica",
      "label": "Datos del banco",
      "pregunta": "CUIT, sucursal o domicilio del banco destinatario",
      "valor_sugerido": "",
      "requerido": true,
      "motivo": "El proveído ordena oficio pero no indica sucursal"
    }
  ]
}

Si apto=false, devolvé solo apto y motivo_rechazo.`;
}

function parsePreguntasLogistica(raw: unknown): PreguntaEscrito[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, idx) => {
      const p = item as Record<string, unknown>;
      const id = String(p.id ?? `logistica_${idx}`).trim();
      const label = String(p.label ?? p.pregunta ?? id).trim();
      const pregunta = String(p.pregunta ?? label).trim();
      if (!pregunta) return null;

      const parsed: PreguntaEscrito = {
        id,
        categoria: "logistica",
        label,
        pregunta,
        valor_sugerido: String(p.valor_sugerido ?? "").trim(),
        requerido: p.requerido !== false,
        motivo: p.motivo ? String(p.motivo) : undefined,
        tipo_campo: p.tipo_campo === "textarea" ? "textarea" : "text",
      };
      return parsed;
    })
    .filter((p): p is PreguntaEscrito => p !== null)
    .slice(0, 2);
}

function parseDatosExtraidos(raw: unknown): DatosExtraidosEscrito {
  if (!raw || typeof raw !== "object") return {};
  const d = raw as Record<string, unknown>;

  const partes = Array.isArray(d.partes)
    ? d.partes
        .map((p) => {
          const parte = p as Record<string, unknown>;
          const nombre = String(parte.nombre ?? "").trim();
          const apellido = String(parte.apellido ?? "").trim();
          if (!nombre && !apellido) return null;
          return {
            nombre: nombre || "Sin nombre",
            apellido: apellido || "Sin apellido",
            rol: parte.rol ? String(parte.rol) : undefined,
            domicilio: parte.domicilio ? String(parte.domicilio) : undefined,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
    : undefined;

  return {
    juzgado: d.juzgado ? String(d.juzgado) : undefined,
    jurisdiccion: d.jurisdiccion ? String(d.jurisdiccion) : undefined,
    caratula: d.caratula ? String(d.caratula) : undefined,
    numero_expediente: d.numero_expediente
      ? String(d.numero_expediente)
      : undefined,
    fecha_resolucion: d.fecha_resolucion
      ? String(d.fecha_resolucion).slice(0, 10)
      : undefined,
    texto_proveido: d.texto_proveido ? String(d.texto_proveido) : undefined,
    transcripcion_auto: d.transcripcion_auto
      ? String(d.transcripcion_auto)
      : undefined,
    parte_a_notificar: d.parte_a_notificar
      ? String(d.parte_a_notificar)
      : undefined,
    partes,
  };
}

function mapDocumentoSugerido(raw: string): DocumentoSolicitado {
  if (raw === "oficio" || raw === "mandamiento") return raw;
  return "cedula";
}

export async function prepararEscritoConIA(input: {
  numeroExpediente: string;
  caratula: string;
  documentoTexto: string;
  documentoSolicitado?: DocumentoSolicitado;
  contextoAnalisis?: string;
  perfil: PerfilEscritoResumen;
  lectura?: PreparacionEscrito["lectura"];
}): Promise<PreparacionEscrito> {
  if (!input.documentoTexto.trim()) {
    throw new Error("No se pudo leer texto del documento cargado.");
  }

  const content = await createChatCompletion({
    jsonMode: true,
    temperature: 0.1,
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

  if (!isAptoFromRaw(parsed)) {
    const motivo = String(parsed.motivo_rechazo ?? parsed.resumen ?? "").trim();
    throw new DocumentoNoAptoError(
      motivo ||
        "El archivo no corresponde a un trámite judicial. Cargá un proveído o notificación del juzgado."
    );
  }

  const datos = parseDatosExtraidos(parsed.datos_extraidos);
  const tipoDocRaw = String(
    parsed.tipo_documento_sugerido ?? input.documentoSolicitado ?? "cedula"
  ).toLowerCase();
  const tipoDocumentoSugerido = mapDocumentoSugerido(tipoDocRaw);
  const tipoTramite = parsed.tipo_tramite ? String(parsed.tipo_tramite) : undefined;
  const resumen = String(parsed.resumen ?? "Trámite judicial detectado");

  const preguntasIa = parsePreguntasLogistica(
    parsed.preguntas_logistica ?? parsed.preguntas
  );

  if (!datos.caratula?.trim()) {
    datos.caratula = input.caratula;
  }
  if (!datos.numero_expediente?.trim()) {
    datos.numero_expediente = input.numeroExpediente;
  }
  if (!datos.transcripcion_auto?.trim() && datos.texto_proveido?.trim()) {
    datos.transcripcion_auto = datos.texto_proveido;
  }

  const preguntas = mergePreparacionPreguntas({
    tipoDocumentoSugerido: tipoDocumentoSugerido,
    tipoTramite,
    datos,
    preguntasIa,
  });

  return {
    apto: true,
    resumen,
    tipo_tramite: tipoTramite,
    tipo_documento_sugerido: tipoDocumentoSugerido,
    datos_extraidos: datos,
    preguntas,
    perfil: input.perfil,
    lectura: input.lectura,
  };
}

export function formatRespuestasParaPrompt(
  respuestas: Record<string, string>
): string {
  const estrategico = Object.entries(respuestas)
    .filter(([k, v]) => v.trim() && isEstrategico(k))
    .map(([k, v]) => `- ${labelRespuesta(k)}: ${v.trim()}`);

  const logistica = Object.entries(respuestas)
    .filter(([k, v]) => v.trim() && !isEstrategico(k))
    .map(([k, v]) => `- ${labelRespuesta(k)}: ${v.trim()}`);

  const partes: string[] = [];
  if (estrategico.length) {
    partes.push("Decisiones del letrado:\n" + estrategico.join("\n"));
  }
  if (logistica.length) {
    partes.push("Datos logísticos:\n" + logistica.join("\n"));
  }
  return partes.join("\n\n");
}

function isEstrategico(id: string): boolean {
  return (
    id === "objetivo_escrito" ||
    id === "instrucciones_especificas" ||
    id === "argumentos_prueba"
  );
}

function labelRespuesta(id: string): string {
  const labels: Record<string, string> = {
    objetivo_escrito: "Objetivo / tipo de escrito",
    instrucciones_especificas: "Instrucciones específicas",
    argumentos_prueba: "Argumentos y prueba",
    jurisdiccion_plantilla: "Jurisdicción / modelo de escrito",
    tipo_domicilio_notificacion: "Tipo de domicilio",
    domicilio_notificacion: "Domicilio de notificación",
    lleva_copias_adjuntas: "Copias adjuntas",
    detalle_copias: "Detalle de copias",
    entidad_destinataria: "Entidad destinataria",
    dato_a_informar: "Dato a informar por la entidad",
    datos_entidad_extra: "Datos extra de la entidad",
    datos_tercero: "Datos del tercero",
    domicilio_destinatario: "Domicilio destinatario",
    destinatario: "Destinatario",
    documentacion_adjunta: "Documentación adjunta",
  };
  return labels[id] ?? id;
}

export function documentoDesdeRespuestas(
  respuestas: Record<string, string> | undefined,
  fallback: DocumentoSolicitado
): DocumentoSolicitado {
  const raw = respuestas?.objetivo_escrito?.trim();
  if (raw === "oficio" || raw === "mandamiento" || raw === "cedula") return raw;
  return fallback;
}
