"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExpedienteForm from "@/components/dashboard/ExpedienteForm";
import ExpedienteList from "@/components/dashboard/ExpedienteList";
import NovedadesFeed from "@/components/dashboard/NovedadesFeed";
import type { ExpedienteConNovedades } from "@/types";

interface ExpedientesClientProps {
  expedientes: ExpedienteConNovedades[];
  totalNoLeidas: number;
}

/** Expedientes manuales: alta de causas y registro de novedades (sin SISFE). */
export default function ExpedientesClient({
  expedientes,
  totalNoLeidas,
}: ExpedientesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(expedientes);

  useEffect(() => {
    setItems(expedientes);
  }, [expedientes]);

  const allNovedades = items
    .flatMap((exp) =>
      exp.novedades.map((n) => ({
        ...n,
        expediente_numero: exp.numero,
        expediente_jurisdiccion: exp.jurisdiccion,
      }))
    )
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Expedientes</h1>
        <p className="text-sm text-muted mt-1">
          Registro manual de causas. Las novedades se cargan al consultar o agregar
          en el historial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Expedientes" value={items.length} />
        <StatCard
          label="Sin leer"
          value={totalNoLeidas}
          highlight={totalNoLeidas > 0}
        />
        <StatCard label="Novedades" value={allNovedades.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ExpedienteForm onSuccess={() => router.refresh()} />
          <ExpedienteList expedientes={items} />
        </div>
        <div className="lg:col-span-2">
          <NovedadesFeed novedades={allNovedades} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`text-3xl font-bold mt-1 ${highlight ? "text-accent" : "text-primary"}`}
      >
        {value}
      </p>
    </div>
  );
}
