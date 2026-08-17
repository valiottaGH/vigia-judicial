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
import { extraerTextoDocumentoParaIA } from "@/lib/expedientes/preparar-documento-ia";
import { jurisdiccionLabelDesdeKey } from "@/lib/jurisdicciones/options";
import { parsePlantillaSeleccion } from "@/lib/plantillas-cedula/select-options";
import { getPlantillaCedulaUsuario } from "@/lib/plantillas-cedula/repository";
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
  respuestasUsuario?: Record<string, string>;
  datosPreparados?: import("@/lib/cedulas/preparar-escrito").DatosExtraidosEscrito;
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
  const { texto: documentoTexto } = await extraerTextoDocumentoParaIA(
    bytes,
    adjunto.mime_type
  );
  const contexto = formatContextoAnalisis(fila);

  let expediente = expedienteRow as ExpedienteActuaciones;

  const plantillaSeleccion = parsePlantillaSeleccion(
    input.respuestasUsuario?.jurisdiccion_plantilla
  );

  let userPlantilla:
    | { id: string; nombre: string; storagePath: string }
    | undefined;

  if (plantillaSeleccion?.type === "user") {
    const plantilla = await getPlantillaCedulaUsuario({
      supabase: input.supabase,
      userId: input.userId,
      plantillaId: plantillaSeleccion.id,
    });
    if (!plantilla) {
      throw new Error(
        "La plantilla seleccionada no existe. Volvé a elegir el modelo en el paso de confirmación."
      );
    }
    userPlantilla = {
      id: plantilla.id,
      nombre: plantilla.nombre,
      storagePath: plantilla.storage_path,
    };
  } else {
    const jurisdiccionElegida = jurisdiccionLabelDesdeKey(
      input.respuestasUsuario?.jurisdiccion_plantilla
    );
    if (jurisdiccionElegida) {
      await input.supabase
        .from("expedientes")
        .update({ jurisdiccion: jurisdiccionElegida } as never)
        .eq("id", expediente.id);
      expediente = { ...expediente, jurisdiccion: jurisdiccionElegida };
    }
  }

  const interpretacion = await interpretarNotificacion({
    numeroExpediente: expedienteRow.numero,
    caratula: expedienteRow.caratula ?? "",
    documentoTexto: `${contexto}\n\n--- DOCUMENTO ORIGINAL ---\n${documentoTexto}`,
    documentoSolicitado: input.documentoSolicitado,
    contextoAnalisis: contexto,
    respuestasUsuario: input.respuestasUsuario,
    datosPreparados: input.datosPreparados,
  });

  let expedienteAfter = expediente;

  if (interpretacion.juzgado) {
    await input.supabase
      .from("expedientes")
      .update({ juzgado: interpretacion.juzgado } as never)
      .eq("id", expediente.id);
    expedienteAfter = { ...expedienteAfter, juzgado: interpretacion.juzgado };
  }

  if (interpretacion.jurisdiccion && plantillaSeleccion?.type !== "user") {
    await input.supabase
      .from("expedientes")
      .update({ jurisdiccion: interpretacion.jurisdiccion } as never)
      .eq("id", expediente.id);
    expedienteAfter = {
      ...expedienteAfter,
      jurisdiccion: interpretacion.jurisdiccion,
    };
  }

  const { resolucion, partes } = await persistirInterpretacion({
    supabase: input.supabase,
    expedienteId: expediente.id,
    interpretacion,
  });

  const generado = await generarDocumentoDesdeInterpretacion({
    userId: input.userId,
    expediente: expedienteAfter,
    resolucion,
    partes,
    interpretacion,
    profile: input.profile,
    planAtGeneration: input.planAtGeneration,
    userPlantilla,
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
