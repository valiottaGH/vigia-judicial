import { createClient } from "@/lib/supabase/server";
import ConfigMembreteForm from "@/components/config/ConfigMembreteForm";
import { PERFIL_ESCRITO_SELECT } from "@/lib/profile/perfil-escrito";
import type { MembreteProfile } from "@/types";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(PERFIL_ESCRITO_SELECT)
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-sm text-muted mt-1">
          Datos de firma y membrete para todos los escritos (categoría 3 — se
          cargan una sola vez).
        </p>
      </div>
      <ConfigMembreteForm
        initial={profile as MembreteProfile | null}
      />
    </div>
  );
}
