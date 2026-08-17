import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AnalisisPlantillaCedula, PlantillaCedulaUsuario } from "./types";

function mapPlantillaRow(row: Record<string, unknown>): PlantillaCedulaUsuario {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    nombre: String(row.nombre),
    descripcion: row.descripcion != null ? String(row.descripcion) : null,
    storage_path: String(row.storage_path),
    nombre_archivo: String(row.nombre_archivo),
    mime_type: String(row.mime_type),
    tamano_bytes: Number(row.tamano_bytes),
    analisis_ia: (row.analisis_ia as AnalisisPlantillaCedula | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listPlantillasCedulaUsuario(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PlantillaCedulaUsuario[]> {
  const { data, error } = await supabase
    .from("plantillas_cedula_usuario")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapPlantillaRow(row as Record<string, unknown>)
  );
}

export async function getPlantillaCedulaUsuario(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  plantillaId: string;
}): Promise<PlantillaCedulaUsuario | null> {
  const { data, error } = await input.supabase
    .from("plantillas_cedula_usuario")
    .select("*")
    .eq("id", input.plantillaId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return mapPlantillaRow(data as Record<string, unknown>);
}
