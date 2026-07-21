import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EscritoEditorPage from "@/components/escritos/EscritoEditorPage";
import type { Escrito } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function EscritoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: escrito } = await supabase
    .from("escritos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!escrito) notFound();

  return <EscritoEditorPage escrito={escrito as Escrito} />;
}
