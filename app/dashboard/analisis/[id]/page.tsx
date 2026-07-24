import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AnalisisDetallePage from "@/components/analisis/AnalisisDetallePage";
import type { DocumentoAnalisis } from "@/lib/analisis/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function AnalisisDetalleServerPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: analisis } = await supabase
    .from("documento_analisis")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!analisis) notFound();

  return <AnalisisDetallePage analisis={analisis as DocumentoAnalisis} />;
}
