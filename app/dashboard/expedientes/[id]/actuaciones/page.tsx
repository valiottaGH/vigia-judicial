import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActuacionesGeneradorPage from "@/components/actuaciones/ActuacionesGeneradorPage";
import type { ExpedienteActuaciones } from "@/lib/actuaciones/types";
import type { ParteExpediente, Resolucion } from "@/lib/actuaciones/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function ActuacionesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: expediente, error } = await supabase
    .from("expedientes")
    .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !expediente) {
    notFound();
  }

  const { data: partes } = await supabase
    .from("partes_expediente")
    .select("*")
    .eq("expediente_id", id)
    .order("created_at", { ascending: true });

  const { data: resoluciones } = await supabase
    .from("resoluciones")
    .select("*")
    .eq("expediente_id", id)
    .order("fecha", { ascending: false });

  return (
    <ActuacionesGeneradorPage
      expediente={expediente as ExpedienteActuaciones}
      partesIniciales={(partes ?? []) as ParteExpediente[]}
      resolucionesIniciales={(resoluciones ?? []) as Resolucion[]}
    />
  );
}
