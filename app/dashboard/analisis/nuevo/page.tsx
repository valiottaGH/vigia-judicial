import { redirect } from "next/navigation";
import NuevoAnalisisForm from "@/components/analisis/NuevoAnalisisForm";
import { createClient } from "@/lib/supabase/server";

export default async function NuevoAnalisisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo análisis</h1>
        <p className="text-sm text-muted mt-2">
          Cargá los documentos de la causa y elegí qué tipo de datos extraer.
        </p>
      </div>
      <NuevoAnalisisForm />
    </div>
  );
}
