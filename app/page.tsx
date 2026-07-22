import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-accent uppercase tracking-widest">
            SaaS Judicial
          </p>
          <h1 className="text-4xl font-bold text-primary">Vigía Judicial</h1>
          <p className="text-muted text-lg">
            Redactá escritos, organizá expedientes y generá actuaciones judiciales.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-card transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
