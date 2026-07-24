import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalisisListPage from "@/components/analisis/AnalisisListPage";
import { isAiConfigured } from "@/lib/ai/config";
import type { DocumentoAnalisis } from "@/lib/analisis/types";

export default async function AnalisisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: analisis } = await supabase
    .from("documento_analisis")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <AnalisisListPage
      analisisInicial={(analisis ?? []) as DocumentoAnalisis[]}
      aiDisponible={isAiConfigured()}
    />
  );
}
