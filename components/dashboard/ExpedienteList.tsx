"use client";

import Link from "next/link";
import { useState } from "react";
import AdjuntosPanel from "@/components/adjuntos/AdjuntosPanel";
import type { Expediente } from "@/types";

interface ExpedienteListProps {
  expedientes: Expediente[];
}

export default function ExpedienteList({ expedientes }: ExpedienteListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (expedientes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">
          Mis expedientes
        </h2>
        <p className="text-sm text-muted">
          Todavía no agregaste expedientes. Usá el formulario de arriba para
          empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">
        Mis expedientes ({expedientes.length})
      </h2>
      <ul className="space-y-3">
        {expedientes.map((exp) => {
          const expanded = expandedId === exp.id;
          return (
            <li
              key={exp.id}
              className="p-4 border border-border rounded-lg hover:border-primary/30 transition"
            >
              <div>
                <p className="font-medium text-sm">{exp.numero}</p>
                <p className="text-xs text-muted mt-0.5">
                  {exp.jurisdiccion}
                  {exp.fuero ? ` · ${exp.fuero}` : ""}
                </p>
                {exp.caratula && (
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {exp.caratula}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Link
                  href={`/dashboard/expedientes/${exp.id}/actuaciones`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Generar actuaciones →
                </Link>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : exp.id)}
                  className="text-xs text-muted hover:text-primary"
                >
                  {expanded ? "Ocultar archivos" : "Ver archivos adjuntos"}
                </button>
              </div>
              {expanded && (
                <div className="mt-4 pt-4 border-t border-border">
                  <AdjuntosPanel expedienteId={exp.id} compact />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
