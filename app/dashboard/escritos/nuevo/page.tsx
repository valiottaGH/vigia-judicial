import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NuevoEscritoForm from "@/components/escritos/NuevoEscritoForm";
import type { MembreteProfile } from "@/types";

export default async function NuevoEscritoPage() {
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
        <Link
          href="/dashboard/escritos"
          className="text-sm text-primary hover:underline"
        >
          ← Escritos
        </Link>
        <h1 className="text-2xl font-bold text-primary mt-2">Nuevo escrito</h1>
        <p className="text-sm text-muted mt-1">
          Elegi una plantilla. Podes editar el contenido despues de crearlo.
        </p>
      </div>

      {!profile?.matricula && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
          Tip: configura tu membrete en{" "}
          <Link href="/dashboard/configuracion" className="text-primary underline">
            Configuracion
          </Link>{" "}
          para que las plantillas y el PDF salgan con tus datos.
        </div>
      )}

      <NuevoEscritoForm membrete={profile as MembreteProfile | null} />
    </div>
  );
}
