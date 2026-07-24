import Link from "next/link";
import AppLogo from "@/components/layout/AppLogo";
import PricingSection from "@/components/marketing/PricingSection";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl text-center space-y-6">
        <div className="space-y-2 flex flex-col items-center">
          <AppLogo size="xl" showText={false} />
          <h1 className="text-4xl font-bold text-primary">Fast Cedu</h1>
          <p className="text-muted text-lg leading-relaxed">
            Revisá cientos de documentos en minutos con IA. Extraé montos,
            fechas, partes y cláusulas sin abrir cada archivo — y generá la
            cédula, oficio o mandamiento desde los resultados.
          </p>
        </div>

        <ul className="text-left text-sm text-muted space-y-2 max-w-md mx-auto">
          <li>• Tabla automática con citas al documento de origen</li>
          <li>• General, contratos o sentencias según el tipo de causa</li>
          <li>• Generación de escritos procesales en un clic</li>
        </ul>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login?mode=signup"
            className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>

      <PricingSection />

      <footer className="mt-16 text-center text-sm text-muted space-x-4">
        <Link href="/privacidad" className="hover:text-primary underline-offset-2 hover:underline">
          Política de privacidad
        </Link>
      </footer>
    </main>
  );
}
