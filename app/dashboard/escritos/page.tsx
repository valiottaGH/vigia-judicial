import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPlantilla } from "@/lib/escritos/plantillas";
import type { Escrito } from "@/types";

export default async function EscritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: escritos } = await supabase
    .from("escritos")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  const lista = (escritos ?? []) as Escrito[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Escritos</h1>
          <p className="text-sm text-muted mt-1">
            Redacta, guarda y exporta escritos con plantillas y membrete.
          </p>
        </div>
        <Link
          href="/dashboard/escritos/nuevo"
          className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Nuevo escrito
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted mb-4">Todavia no tenes escritos.</p>
          <Link
            href="/dashboard/escritos/nuevo"
            className="text-primary font-medium hover:underline"
          >
            Crear el primero →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((e) => {
            const plantilla = getPlantilla(e.tipo);
            return (
              <li key={e.id}>
                <Link
                  href={`/dashboard/escritos/${e.id}`}
                  className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-primary">{e.titulo}</p>
                      <p className="text-sm text-muted mt-0.5">
                        {plantilla?.nombre ?? e.tipo} ·{" "}
                        {e.estado === "finalizado" ? "Finalizado" : "Borrador"}
                      </p>
                    </div>
                    <time className="text-xs text-muted">
                      {new Date(e.updated_at).toLocaleDateString("es-AR")}
                    </time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
