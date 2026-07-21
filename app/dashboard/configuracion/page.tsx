import { createClient } from "@/lib/supabase/server";
import ConfigMembreteForm from "@/components/config/ConfigMembreteForm";
import type { MembreteProfile } from "@/types";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, estudio_nombre, matricula, domicilio_profesional, telefono, ciudad"
    )
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Configuracion</h1>
        <p className="text-sm text-muted mt-1">
          Membrete del estudio para plantillas y exportacion PDF.
        </p>
      </div>
      <ConfigMembreteForm initial={profile as MembreteProfile | null} />
    </div>
  );
}
