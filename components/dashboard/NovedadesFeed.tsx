"use client";

import { useState } from "react";
import type { Novedad } from "@/types";

interface NovedadConExpediente extends Novedad {
  expediente_numero: string;
  expediente_jurisdiccion: string;
}

interface NovedadesFeedProps {
  novedades: NovedadConExpediente[];
}

export default function NovedadesFeed({ novedades }: NovedadesFeedProps) {
  const [items, setItems] = useState(novedades);

  async function marcarLeida(id: string) {
    const res = await fetch("/api/novedades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, leida: true }),
    });

    if (res.ok) {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">
        Novedades recientes
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          No hay novedades todavía. Agregá un expediente y consultá SISFE para
          ver actualizaciones.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((novedad) => (
            <li
              key={novedad.id}
              className={`p-4 border rounded-lg transition ${
                novedad.leida
                  ? "border-border bg-background/50 opacity-75"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {novedad.tipo}
                    </span>
                    <span className="text-xs text-muted">
                      {novedad.expediente_numero} ·{" "}
                      {novedad.expediente_jurisdiccion}
                    </span>
                  </div>
                  <p className="text-sm mt-2">{novedad.descripcion}</p>
                  <p className="text-xs text-muted mt-2">
                    {new Date(novedad.fecha).toLocaleString("es-AR")}
                  </p>
                </div>
                {!novedad.leida && (
                  <button
                    onClick={() => marcarLeida(novedad.id)}
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
