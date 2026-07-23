import Link from "next/link";

export default function MembreteAlertBanner() {
  return (
    <div
      className="rounded-xl border border-accent bg-accent-light/50 px-4 py-3 text-sm text-gray-900 flex flex-wrap items-center justify-between gap-3"
      role="alert"
    >
      <p className="font-medium">
        Completá tu membrete (nombre y matrícula) para generar cédulas con IA.
      </p>
      <Link
        href="/dashboard/configuracion"
        className="shrink-0 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
      >
        Completar membrete
      </Link>
    </div>
  );
}
