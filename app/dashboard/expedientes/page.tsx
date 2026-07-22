import { createClient } from "@/lib/supabase/server";
import ExpedientesClient from "@/components/dashboard/ExpedientesClient";
import type { Expediente } from "@/types";

async function getExpedientes(userId: string): Promise<Expediente[]> {
  const supabase = await createClient();

  const { data: expedientes, error } = await supabase
    .from("expedientes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !expedientes) {
    return [];
  }

  return expedientes as Expediente[];
}

export default async function ExpedientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expedientes = await getExpedientes(user!.id);

  return <ExpedientesClient expedientes={expedientes} />;
}
