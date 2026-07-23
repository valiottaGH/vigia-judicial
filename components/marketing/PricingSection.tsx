import { PLANES } from "@/lib/subscription/plans";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section className="w-full max-w-5xl mt-16 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary">Planes</h2>
        <p className="text-muted mt-2">
          Elegí el plan que mejor se adapte a tu práctica.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded-xl border bg-card text-left flex flex-col ${
              plan.destacado
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            }`}
          >
            {plan.destacado && (
              <span className="text-xs font-semibold text-primary mb-2">
                Recomendado
              </span>
            )}
            <p className="font-bold text-lg text-primary">{plan.nombre}</p>
            <p className="text-2xl font-bold mt-1">{plan.precio}</p>
            <p className="text-sm text-muted mt-2">{plan.descripcion}</p>
            <ul className="mt-4 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm flex items-start gap-2">
                  <span className="text-success shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login?mode=signup"
              className={`mt-6 block text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                plan.destacado
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "border border-primary text-primary hover:bg-primary/5"
              }`}
            >
              {plan.id === "free" ? "Empezar gratis" : "Registrarse"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
