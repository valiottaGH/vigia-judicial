import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NuevoAnalisisForm from "@/components/analisis/NuevoAnalisisForm";
import type { AnalisisPlantilla } from "@/lib/analisis/types";

export default async function NuevoAnalisisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: plantillas } = await supabase
    .from("analisis_plantillas")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo análisis</h1>
        <p className="text-sm text-muted mt-2">
          Cargá los documentos de la causa y elegí qué datos extraer.
        </p>
      </div>
      <NuevoAnalisisForm
        plantillasPersonalizadas={(plantillas ?? []) as AnalisisPlantilla[]}
      />
    </div>
  );
}
