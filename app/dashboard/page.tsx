import { createClient } from "@/lib/supabase/server";
import GeneradorCedulasPage from "@/components/cedulas/GeneradorCedulasPage";
import { isAiConfigured } from "@/lib/ai/config";
import { isMembreteCompleto } from "@/lib/profile/membrete";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, matricula")
    .eq("id", user!.id)
    .maybeSingle();

  const membreteCompleto = isMembreteCompleto(profile);

  return (
    <GeneradorCedulasPage
      aiDisponible={isAiConfigured()}
      membreteCompleto={membreteCompleto}
    />
  );
}
