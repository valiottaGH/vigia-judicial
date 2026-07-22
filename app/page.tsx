import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">Fast Cedu</h1>
          <p className="text-muted text-lg leading-relaxed">
            Cargá la notificación del juzgado y la IA genera la cédula o carta
            documento con la respuesta automáticamente.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
