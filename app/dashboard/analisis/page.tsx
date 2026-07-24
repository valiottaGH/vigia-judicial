import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalisisListPage from "@/components/analisis/AnalisisListPage";
import { PLANTILLAS_SISTEMA } from "@/lib/analisis/plantillas-sistema";
import { isAiConfigured } from "@/lib/ai/config";
import type { AnalisisPlantilla, DocumentoAnalisis } from "@/lib/analisis/types";

export default async function AnalisisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: analisis }, { data: plantillas }] = await Promise.all([
    supabase
      .from("documento_analisis")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("analisis_plantillas")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <AnalisisListPage
      analisisInicial={(analisis ?? []) as DocumentoAnalisis[]}
      aiDisponible={isAiConfigured()}
      plantillasSistema={PLANTILLAS_SISTEMA}
      plantillasPersonalizadas={(plantillas ?? []) as AnalisisPlantilla[]}
    />
  );
}
