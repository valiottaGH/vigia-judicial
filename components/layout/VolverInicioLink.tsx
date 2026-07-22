import Link from "next/link";

export default function VolverInicioLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition"
    >
      <ArrowLeftIcon />
      Volver a inicio
    </Link>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
