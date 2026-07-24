import { interpretarNotificacion } from "@/lib/cedulas/interpret-notificacion-ai";
import {
  generarDocumentoDesdeInterpretacion,
  persistirInterpretacion,
} from "@/lib/cedulas/generate-from-interpretacion";
import type { DocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";
import type { MembreteProfile } from "@/types";
import type { ExpedienteActuaciones } from "@/lib/actuaciones/types";
import type { PlanId } from "@/lib/subscription/plans";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { downloadAdjuntoFromStorage } from "@/lib/adjuntos/storage";
import { extractTextFromBuffer } from "@/lib/expedientes/extract-text";
import type { InterpretacionNotificacion } from "@/lib/cedulas/types";
import type { DocumentoAnalisis, FilaAnalisis } from "./types";

function formatContextoAnalisis(fila: FilaAnalisis): string {
  const lineas = Object.entries(fila.celdas).map(
    ([campo, celda]) =>
      `- ${campo}: ${celda.valor}${celda.cita ? ` (cita: «${celda.cita}»)` : ""}`
  );
  return `Datos extraídos del análisis previo:\n${lineas.join("\n")}`;
}

export async function generarEscritoDesdeAnalisis(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  analisis: DocumentoAnalisis;
  adjuntoId: string;
  documentoSolicitado: DocumentoSolicitado;
  profile: MembreteProfile;
  planAtGeneration: PlanId;
}): Promise<{
  actuacion_id: string;
  download_url: string;
  download_filename: string;
  documentos_count: number;
  expediente_id: string;
  interpretacion: InterpretacionNotificacion;
}> {
  const fila = input.analisis.resultado?.filas.find(
    (f) => f.adjunto_id === input.adjuntoId
  );
  if (!fila) {
    throw new Error("Documento no encontrado en el análisis");
  }

  const { data: adjunto } = await input.supabase
    .from("expediente_adjuntos")
    .select("id, storage_path, mime_type, expediente_id, nombre_original")
    .eq("id", input.adjuntoId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!adjunto) {
    throw new Error("Adjunto no encontrado");
  }

  const { data: expedienteRow } = await input.supabase
    .from("expedientes")
    .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
    .eq("id", adjunto.expediente_id)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!expedienteRow) {
    throw new Error("Expediente no encontrado");
  }

  const bytes = await downloadAdjuntoFromStorage(adjunto.storage_path);
  const documentoTexto = await extractTextFromBuffer(bytes, adjunto.mime_type);
  const contexto = formatContextoAnalisis(fila);

  const interpretacion = await interpretarNotificacion({
    numeroExpediente: expedienteRow.numero,
    caratula: expedienteRow.caratula ?? "",
    documentoTexto: `${contexto}\n\n--- DOCUMENTO ORIGINAL ---\n${documentoTexto}`,
    documentoSolicitado: input.documentoSolicitado,
  });

  let expediente = expedienteRow as ExpedienteActuaciones;

  if (interpretacion.juzgado) {
    await input.supabase
      .from("expedientes")
      .update({ juzgado: interpretacion.juzgado } as never)
      .eq("id", expediente.id);
    expediente = { ...expediente, juzgado: interpretacion.juzgado };
  }

  if (interpretacion.jurisdiccion) {
    await input.supabase
      .from("expedientes")
      .update({ jurisdiccion: interpretacion.jurisdiccion } as never)
      .eq("id", expediente.id);
    expediente = { ...expediente, jurisdiccion: interpretacion.jurisdiccion };
  }

  const { resolucion, partes } = await persistirInterpretacion({
    supabase: input.supabase,
    expedienteId: expediente.id,
    interpretacion,
  });

  const generado = await generarDocumentoDesdeInterpretacion({
    userId: input.userId,
    expediente,
    resolucion,
    partes,
    interpretacion,
    profile: input.profile,
    planAtGeneration: input.planAtGeneration,
  });

  return {
    actuacion_id: generado.actuacion_id,
    download_url: generado.download_url,
    download_filename: generado.download_filename,
    documentos_count: generado.documentos_count,
    expediente_id: expediente.id,
    interpretacion,
  };
}
