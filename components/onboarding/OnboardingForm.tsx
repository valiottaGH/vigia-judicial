"use client";

import { useState } from "react";

export default function OnboardingForm() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!accepted) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/disclaimer", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ?? "No se pudo guardar la aceptacion. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Bienvenido a Vigia Judicial
        </h1>
        <p className="text-muted mb-6">
          Antes de continuar, lee y acepta los terminos de uso.
        </p>

        <div className="bg-background border border-border rounded-lg p-5 text-sm space-y-4 max-h-80 overflow-y-auto mb-6">
          <section>
            <h2 className="font-semibold text-primary mb-1">
              Herramienta de apoyo
            </h2>
            <p className="text-muted">
              Vigia Judicial es una herramienta para abogados que facilita la
              redaccion de escritos, la organizacion de expedientes y la
              generacion de actuaciones judiciales. No reemplaza el criterio
              profesional ni los sistemas oficiales del Poder Judicial.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-primary mb-1">
              Revision profesional
            </h2>
            <p className="text-muted">
              Los documentos generados usan plantillas juridicas controladas.
              Siempre revisa y adapta el texto antes de presentarlo en sede
              judicial.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-primary mb-1">
              Datos personales
            </h2>
            <p className="text-muted">
              Tratamos tus datos conforme a la Ley 25.326 de Proteccion de
              Datos Personales. Podes solicitar la eliminacion de tu cuenta y
              datos en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-primary mb-1">
              Responsabilidad del usuario
            </h2>
            <p className="text-muted">
              Sos responsable de la confidencialidad de tu cuenta y del uso que
              hagas de los documentos generados. No compartas tu acceso con
              terceros no autorizados.
            </p>
          </section>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-danger text-sm">
            {error}
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            Lei y acepto los terminos. Entiendo que Vigia Judicial es una
            herramienta de apoyo y no sustituye la revision letrada ni los
            sistemas judiciales oficiales.
          </span>
        </label>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!accepted || loading}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Continuar al dashboard"}
        </button>
      </div>
    </main>
  );
}
