"use client";

import { useEffect, useState } from "react";

interface GenerarConIaPanelProps {
  tipo: string;
  variables?: Record<string, string>;
  onGenerated: (html: string) => void;
  compact?: boolean;
}

export default function GenerarConIaPanel({
  tipo,
  variables,
  onGenerated,
  compact = false,
}: GenerarConIaPanelProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [instrucciones, setInstrucciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/escritos/generate")
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, []);

  if (configured === false) {
    return (
      <div className="p-4 bg-background border border-border rounded-xl text-sm text-muted">
        Generacion con IA desactivada. Agrega{" "}
        <code className="text-xs">OPENAI_API_KEY</code> en{" "}
        <code className="text-xs">.env.local</code> y reinicia el servidor. Ver{" "}
        <code className="text-xs">docs/ESCRITOS-IA.md</code>.
      </div>
    );
  }

  if (configured === null) {
    return null;
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/escritos/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, instrucciones, variables }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al generar");
    } else {
      onGenerated(data.contenido_html);
      setError(null);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl space-y-3">
      <div>
        <h3 className="font-medium text-primary text-sm">Generar con IA</h3>
        {!compact && (
          <p className="text-xs text-muted mt-1">
            Describe hechos, partes y pedido. La IA redacta un borrador para revisar.
          </p>
        )}
      </div>
      <textarea
        value={instrucciones}
        onChange={(e) => setInstrucciones(e.target.value)}
        rows={compact ? 3 : 5}
        placeholder="Ej: Actor Juan Perez c/ Empresa XYZ s/ danos. Hechos: accidente de transito el 15/03/2025 en Rosario. Petitorio: condena solidaria con intereses..."
        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={loading || !instrucciones.trim()}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Generando..." : compact ? "Regenerar con IA" : "Generar borrador con IA"}
      </button>
    </div>
  );
}
