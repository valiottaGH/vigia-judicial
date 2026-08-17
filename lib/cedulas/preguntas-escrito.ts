import {
  DOCUMENTOS_SOLICITADOS,
  type DocumentoSolicitado,
} from "./documento-solicitado";
import { JURISDICCIONES_ESCRIITO, sugerirJurisdiccionKey } from "@/lib/jurisdicciones/options";
import { USER_PLANTILLA_PREFIX } from "@/lib/plantillas-cedula/constants";
import type {
  DatosExtraidosEscrito,
  PreguntaEscrito,
} from "./preparar-escrito";

const TRAMITES_COMPLEJOS = new Set([
  "traslado",
  "contestacion",
  "recurso",
  "apelacion",
  "embargo",
  "vista_causa",
  "liquidacion",
]);

export function buildPreguntaJurisdiccion(
  jurisdiccionDetectada?: string | null,
  opcionesExtra?: Array<{ value: string; label: string }>
): PreguntaEscrito {
  const sugerida = sugerirJurisdiccionKey(jurisdiccionDetectada);
  const opcionesSistema = JURISDICCIONES_ESCRIITO.map((j) => ({
    value: j.value,
    label: j.label,
  }));
  return {
    id: "jurisdiccion_plantilla",
    categoria: "logistica",
    label: "Jurisdicción del escrito",
    pregunta: opcionesExtra?.length
      ? "Modelo de cédula/oficio: provincial del sistema o tu plantilla DOCX"
      : "Modelo de cédula/oficio según provincia o CABA",
    valor_sugerido: sugerida,
    requerido: true,
    motivo: opcionesExtra?.length
      ? "Podés usar un modelo provincial o una plantilla propia que hayas cargado en Configuración."
      : "La estructura del escrito varía entre Santa Fe, PBA, CABA, Córdoba, etc.",
    tipo_campo: "select",
    opciones: [...opcionesSistema, ...(opcionesExtra ?? [])],
  };
}

function extractOpcionesPlantillaUsuario(
  preguntas: PreguntaEscrito[]
): Array<{ value: string; label: string }> {
  const pregunta = preguntas.find((p) => p.id === "jurisdiccion_plantilla");
  return (
    pregunta?.opciones?.filter((o) =>
      o.value.startsWith(USER_PLANTILLA_PREFIX)
    ) ?? []
  );
}

/** Preguntas estratégicas (categoría 1). */
export function buildPreguntasEstrategicas(input: {
  tipoDocumento: DocumentoSolicitado;
  tipoTramite?: string;
}): PreguntaEscrito[] {
  const preguntas: PreguntaEscrito[] = [
    {
      id: "objetivo_escrito",
      categoria: "estrategico",
      label: "Objetivo / tipo de escrito",
      pregunta: "¿Qué querés generar?",
      valor_sugerido: input.tipoDocumento,
      requerido: true,
      motivo: "El proveído dice qué pasó; vos definís la pieza procesal.",
      tipo_campo: "select",
      opciones: DOCUMENTOS_SOLICITADOS.map((d) => ({
        value: d.id,
        label: `${d.label} — ${d.hint}`,
      })),
    },
    {
      id: "instrucciones_especificas",
      categoria: "estrategico",
      label: "Instrucciones específicas",
      pregunta: "Pedidos concretos adicionales (plazos, habilitación, etc.)",
      valor_sugerido: "",
      requerido: false,
      motivo:
        'Ej.: "Pedí plazo con habilitación de días y horas", "Pedí oficio a Cámara Electoral".',
      tipo_campo: "textarea",
    },
  ];

  if (
    input.tipoTramite &&
    TRAMITES_COMPLEJOS.has(input.tipoTramite.toLowerCase())
  ) {
    preguntas.push({
      id: "argumentos_prueba",
      categoria: "estrategico",
      label: "Argumentos y prueba",
      pregunta: "Versión de los hechos o prueba que querés incluir",
      valor_sugerido: "",
      requerido: false,
      motivo: "Para contestaciones, recursos o escritos de fondo.",
      tipo_campo: "textarea",
    });
  }

  return preguntas;
}

/** Preguntas logísticas según tipo de pieza (categoría 2). */
export function buildPreguntasLogisticasPorTipo(input: {
  tipoDocumento: DocumentoSolicitado;
  datos: DatosExtraidosEscrito;
  preguntasIa: PreguntaEscrito[];
  opcionesPlantillaExtra?: Array<{ value: string; label: string }>;
}): PreguntaEscrito[] {
  const ids = new Set(input.preguntasIa.map((p) => p.id));
  const out: PreguntaEscrito[] = [
    buildPreguntaJurisdiccion(input.datos.jurisdiccion, input.opcionesPlantillaExtra),
  ];

  const iaLogistica = input.preguntasIa.filter((p) => p.categoria === "logistica");
  out.push(...iaLogistica);

  if (input.tipoDocumento === "cedula" || input.tipoDocumento === "mandamiento") {
    out.push(...preguntasCedula(input.datos, ids));
  } else if (input.tipoDocumento === "oficio") {
    out.push(...preguntasOficio(ids));
  }

  return dedupePreguntas(out);
}

function preguntasCedula(
  datos: DatosExtraidosEscrito,
  ids: Set<string>
): PreguntaEscrito[] {
  const preguntas: PreguntaEscrito[] = [];

  const parte =
    datos.partes?.find((p) => p.rol === "demandado") ?? datos.partes?.[0];
  const parteLabel = parte
    ? `${parte.apellido} ${parte.nombre}`.trim()
    : "el destinatario";

  if (!ids.has("tipo_domicilio_notificacion")) {
    preguntas.push({
      id: "tipo_domicilio_notificacion",
      categoria: "logistica",
      label: "¿A qué domicilio enviás la cédula?",
      pregunta: `Tipo de domicilio para notificar a ${parteLabel}`,
      valor_sugerido: parte?.domicilio?.includes("constitu")
        ? "constituido"
        : "denunciado",
      requerido: true,
      motivo: "Real, constituido o denunciado en autos.",
      tipo_campo: "select",
      opciones: [
        { value: "real", label: "Domicilio real" },
        { value: "constituido", label: "Domicilio constituido" },
        { value: "denunciado", label: "Domicilio denunciado en autos" },
      ],
    });
  }

  if (!ids.has("domicilio_notificacion")) {
    const sugerido =
      parte?.domicilio?.trim() ||
      (parte ? "Completar domicilio procesal" : "");
    preguntas.push({
      id: "domicilio_notificacion",
      categoria: "logistica",
      label: "Domicilio de notificación",
      pregunta: "Dirección exacta donde debe diligenciarse la cédula",
      valor_sugerido: sugerido,
      requerido: !parte?.domicilio?.trim(),
      motivo: parte?.domicilio
        ? "Confirmá o corregí el domicilio detectado."
        : "No consta en el proveído.",
      tipo_campo: "text",
    });
  }

  if (!ids.has("lleva_copias_adjuntas")) {
    preguntas.push({
      id: "lleva_copias_adjuntas",
      categoria: "logistica",
      label: "¿Lleva copias adjuntas?",
      pregunta: "¿La cédula debe acompañar copias del auto/resolución?",
      valor_sugerido: "si",
      requerido: true,
      motivo: "Usual en notificaciones de traslados y resoluciones.",
      tipo_campo: "select",
      opciones: [
        { value: "si", label: "Sí — lleva copias" },
        { value: "no", label: "No — sin copias" },
      ],
    });
  }

  if (!ids.has("detalle_copias")) {
    preguntas.push({
      id: "detalle_copias",
      categoria: "logistica",
      label: "Detalle de copias (si aplica)",
      pregunta: "Qué copias se adjuntan (fojas, anexos, etc.)",
      valor_sugerido: "",
      requerido: false,
      motivo: "Solo si respondiste Sí a copias adjuntas.",
      tipo_campo: "textarea",
    });
  }

  return preguntas;
}

function preguntasOficio(ids: Set<string>): PreguntaEscrito[] {
  const preguntas: PreguntaEscrito[] = [];

  if (!ids.has("entidad_destinataria")) {
    preguntas.push({
      id: "entidad_destinataria",
      categoria: "logistica",
      label: "¿A qué entidad va dirigido?",
      pregunta: "Nombre del banco, registro, organismo o empresa",
      valor_sugerido: "",
      requerido: true,
      motivo: "Ej.: Banco de la Nación Argentina, Registro Automotor, AFIP.",
      tipo_campo: "text",
    });
  }

  if (!ids.has("dato_a_informar")) {
    preguntas.push({
      id: "dato_a_informar",
      categoria: "logistica",
      label: "¿Qué debe informar la entidad?",
      pregunta: "Dato específico que el juez ordena obtener o certificar",
      valor_sugerido: "",
      requerido: true,
      motivo:
        "Ej.: saldo de cuenta, titularidad del automotor, domicilio registral, inhibiciones.",
      tipo_campo: "textarea",
    });
  }

  if (!ids.has("datos_entidad_extra")) {
    preguntas.push({
      id: "datos_entidad_extra",
      categoria: "logistica",
      label: "Datos de la entidad (opcional)",
      pregunta: "CUIT, sucursal, domicilio o mail institucional de recepción",
      valor_sugerido: "",
      requerido: false,
      motivo: "Completá si el proveído no los trae.",
      tipo_campo: "textarea",
    });
  }

  return preguntas;
}

function dedupePreguntas(preguntas: PreguntaEscrito[]): PreguntaEscrito[] {
  const seen = new Set<string>();
  return preguntas.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function mergePreparacionPreguntas(input: {
  tipoDocumentoSugerido: DocumentoSolicitado;
  tipoTramite?: string;
  datos: DatosExtraidosEscrito;
  preguntasIa: PreguntaEscrito[];
}): PreguntaEscrito[] {
  const estrategicas = buildPreguntasEstrategicas({
    tipoDocumento: input.tipoDocumentoSugerido,
    tipoTramite: input.tipoTramite,
  });

  const logisticas = buildPreguntasLogisticasPorTipo({
    tipoDocumento: input.tipoDocumentoSugerido,
    datos: input.datos,
    preguntasIa: input.preguntasIa,
  });

  return [...estrategicas, ...logisticas];
}

const LOGISTICA_FIJAS = new Set([
  "jurisdiccion_plantilla",
  "tipo_domicilio_notificacion",
  "domicilio_notificacion",
  "lleva_copias_adjuntas",
  "detalle_copias",
  "entidad_destinataria",
  "dato_a_informar",
  "datos_entidad_extra",
]);

/** Recalcula logística cuando el usuario cambia el tipo de escrito en el paso 2. */
export function preguntasParaConfirmacion(input: {
  preparacion: {
    tipo_documento_sugerido?: DocumentoSolicitado;
    tipo_tramite?: string;
    datos_extraidos: DatosExtraidosEscrito;
    preguntas: PreguntaEscrito[];
  };
  respuestas: Record<string, string>;
}): PreguntaEscrito[] {
  const tipoRaw = input.respuestas.objetivo_escrito?.trim();
  const tipo: DocumentoSolicitado =
    tipoRaw === "oficio" || tipoRaw === "mandamiento" || tipoRaw === "cedula"
      ? tipoRaw
      : input.preparacion.tipo_documento_sugerido ?? "cedula";

  const estrategicas = buildPreguntasEstrategicas({
    tipoDocumento: tipo,
    tipoTramite: input.preparacion.tipo_tramite,
  });

  const iaLogistica = input.preparacion.preguntas.filter(
    (p) => p.categoria === "logistica" && !LOGISTICA_FIJAS.has(p.id)
  );

  const opcionesPlantillaExtra = extractOpcionesPlantillaUsuario(
    input.preparacion.preguntas
  );

  const logisticas = buildPreguntasLogisticasPorTipo({
    tipoDocumento: tipo,
    datos: input.preparacion.datos_extraidos,
    preguntasIa: iaLogistica,
    opcionesPlantillaExtra,
  });

  return [...estrategicas, ...logisticas];
}

export function respuestasInicialesDesdePreguntas(
  preguntas: PreguntaEscrito[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of preguntas) {
    map[p.id] = p.valor_sugerido;
  }
  return map;
}
