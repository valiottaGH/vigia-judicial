"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExpedienteForm from "@/components/dashboard/ExpedienteForm";
import ExpedienteList from "@/components/dashboard/ExpedienteList";
import type { Expediente } from "@/types";

interface ExpedientesClientProps {
  expedientes: Expediente[];
}

export default function ExpedientesClient({
  expedientes,
}: ExpedientesClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(expedientes);

  useEffect(() => {
    setItems(expedientes);
  }, [expedientes]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-primary">Expedientes</h1>
        <p className="text-sm text-muted mt-1">
          Registrá tus causas y generá actuaciones judiciales en lote para cada
          expediente.
        </p>
      </div>

      <ExpedienteForm onSuccess={() => router.refresh()} />
      <ExpedienteList expedientes={items} />
    </div>
  );
}
