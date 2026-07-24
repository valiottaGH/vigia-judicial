import { createServiceClient } from "@/lib/supabase/admin";
import { downloadAdjuntoFromStorage } from "@/lib/adjuntos/storage";
import { extractTextFromBuffer } from "@/lib/expedientes/extract-text";
import { analizarDocumentosConIA } from "./analyze-documents-ai";
import { camposDesdePlantilla } from "./plantillas-sistema";
import type { CampoExtraccion, DocumentoAnalisis, ResultadoAnalisis } from "./types";

export async function ejecutarAnalisisDocumentos(
  analisisId: string,
  userId: string
): Promise<DocumentoAnalisis> {
  const admin = createServiceClient();

  const { data: analisisRow, error: fetchError } = await admin
    .from("documento_analisis")
    .select("*")
    .eq("id", analisisId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !analisisRow) {
    throw new Error("Análisis no encontrado");
  }

  const analisis = analisisRow as unknown as DocumentoAnalisis;
  const campos = camposDesdePlantilla({
    plantillaKey: analisis.plantilla_key,
    plantillaCampos: analisis.campos as CampoExtraccion[],
  });

  await admin
    .from("documento_analisis")
    .update({
      estado: "procesando",
      error_mensaje: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", analisisId);

  const adjuntoIds = analisis.adjunto_ids ?? [];
  if (adjuntoIds.length === 0) {
    await admin
      .from("documento_analisis")
      .update({
        estado: "error",
        error_mensaje: "No hay documentos para analizar",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", analisisId);
    throw new Error("No hay documentos para analizar");
  }

  const { data: adjuntos } = await admin
    .from("expediente_adjuntos")
    .select("id, nombre_original, storage_path, mime_type")
    .in("id", adjuntoIds)
    .eq("user_id", userId);

  const documentosParaIA: Array<{
    adjunto_id: string;
    nombre: string;
    texto: string;
  }> = [];
  const lecturaErrores: string[] = [];

  for (const adj of adjuntos ?? []) {
    try {
      const bytes = await downloadAdjuntoFromStorage(adj.storage_path);
      const texto = await extractTextFromBuffer(bytes, adj.mime_type);
      if (!texto.trim()) {
        lecturaErrores.push(`${adj.nombre_original}: documento vacío o ilegible`);
        continue;
      }
      documentosParaIA.push({
        adjunto_id: adj.id,
        nombre: adj.nombre_original,
        texto,
      });
    } catch (err) {
      lecturaErrores.push(
        `${adj.nombre_original}: ${err instanceof Error ? err.message : "Error de lectura"}`
      );
    }
  }

  let resultado: ResultadoAnalisis;

  try {
    resultado = await analizarDocumentosConIA({
      documentos: documentosParaIA,
      campos,
      concurrency: 3,
    });
    resultado.lectura_errores = [
      ...lecturaErrores,
      ...resultado.lectura_errores,
    ];
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de IA";
    await admin
      .from("documento_analisis")
      .update({
        estado: "error",
        error_mensaje: msg,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", analisisId);
    throw err;
  }

  const { data: updated, error: updateError } = await admin
    .from("documento_analisis")
    .update({
      estado: "completado",
      resultado: resultado as never,
      error_mensaje: null,
      campos: campos as never,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", analisisId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Error al guardar resultados");
  }

  return updated as unknown as DocumentoAnalisis;
}
