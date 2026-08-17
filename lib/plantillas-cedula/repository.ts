import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PlantillaCedulaUsuario } from "./types";

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

  return (data ?? []) as PlantillaCedulaUsuario[];
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

  return (data as PlantillaCedulaUsuario | null) ?? null;
}
