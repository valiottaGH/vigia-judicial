import { createClient } from "@/lib/supabase/server";
import ExpedientesClient from "@/components/dashboard/ExpedientesClient";
import type { Expediente, ExpedienteConNovedades, Novedad } from "@/types";

async function getExpedientes(userId: string): Promise<{
  expedientes: ExpedienteConNovedades[];
  totalNoLeidas: number;
}> {
  const supabase = await createClient();

  const { data: expedientes, error } = await supabase
    .from("expedientes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !expedientes) {
    return { expedientes: [], totalNoLeidas: 0 };
  }

  const ids = expedientes.map((e) => e.id);
  let novedades: Novedad[] = [];

  if (ids.length > 0) {
    const { data } = await supabase
      .from("novedades")
      .select("*")
      .in("expediente_id", ids)
      .order("fecha", { ascending: false });
    novedades = data ?? [];
  }

  const conNovedades: ExpedienteConNovedades[] = expedientes.map((exp) => {
    const expNovedades = novedades.filter((n) => n.expediente_id === exp.id);
    return {
      ...(exp as Expediente),
      novedades: expNovedades,
      novedades_no_leidas: expNovedades.filter((n) => !n.leida).length,
    };
  });

  return {
    expedientes: conNovedades,
    totalNoLeidas: novedades.filter((n) => !n.leida).length,
  };
}

export default async function ExpedientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { expedientes, totalNoLeidas } = await getExpedientes(user!.id);

  return (
    <ExpedientesClient expedientes={expedientes} totalNoLeidas={totalNoLeidas} />
  );
}
