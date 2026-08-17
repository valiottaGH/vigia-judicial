import { createClient } from "@/lib/supabase/server";
import ConfigMembreteForm from "@/components/config/ConfigMembreteForm";
import ConfigPlantillasCedulaForm from "@/components/config/ConfigPlantillasCedulaForm";
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
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-sm text-muted mt-1">
          Datos de firma, membrete y modelos de cédula para tus escritos.
        </p>
      </div>
      <ConfigMembreteForm
        initial={profile as MembreteProfile | null}
      />
      <hr className="border-border" />
      <div id="plantillas-cedula">
        <ConfigPlantillasCedulaForm />
      </div>
    </div>
  );
}
