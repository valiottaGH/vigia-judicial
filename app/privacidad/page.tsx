import Link from "next/link";
import AppLogo from "@/components/layout/AppLogo";

export const metadata = {
  title: "Política de privacidad — Fast Cedu",
};

export default function PrivacidadPage() {
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "soporte@fastcedu.app";

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <AppLogo size="md" showText={false} />
          <div>
            <h1 className="text-2xl font-bold text-primary">Política de privacidad</h1>
            <p className="text-sm text-muted">Fast Cedu — última actualización: julio 2026</p>
          </div>
        </div>

        <section className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Responsable</h2>
          <p>
            Fast Cedu es una herramienta para profesionales del derecho. El tratamiento
            de datos personales se realiza conforme a la Ley 25.326 (Argentina) y buenas
            prácticas de protección de datos.
          </p>

          <h2 className="text-lg font-semibold">2. Datos que recopilamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email, nombre y datos del membrete profesional (matrícula, domicilio).</li>
            <li>Documentos judiciales que subís (PDF, DOC, DOCX) y escritos generados.</li>
            <li>Registros de uso: generaciones con IA, descargas y pagos de suscripción.</li>
            <li>Datos técnicos: IP, user-agent en logs de auditoría de seguridad.</li>
          </ul>

          <h2 className="text-lg font-semibold">3. Finalidad</h2>
          <p>
            Prestamos el servicio de generación de cédulas y actuaciones, gestión de
            expedientes, suscripciones y soporte. No vendemos ni compartimos tus documentos
            con terceros con fines comerciales.
          </p>

          <h2 className="text-lg font-semibold">4. Procesamiento con IA</h2>
          <p>
            El texto extraído de tus notificaciones se envía a proveedores de IA
            (OpenRouter/OpenAI) para interpretar el proveído. Esos proveedores pueden
            procesar datos fuera de Argentina. Consultá sus políticas de retención antes
            de subir información de clientes.
          </p>

          <h2 className="text-lg font-semibold">5. Almacenamiento y seguridad</h2>
          <p>
            Los documentos se almacenan cifrados en reposo (Supabase Storage, buckets
            privados). El acceso requiere autenticación; las descargas quedan registradas
            en un log de auditoría interno.
          </p>

          <h2 className="text-lg font-semibold">6. Pagos</h2>
          <p>
            Los pagos se procesan con Mercado Pago. No almacenamos datos de tarjeta;
            solo recibimos confirmación del pago y referencias de suscripción.
          </p>

          <h2 className="text-lg font-semibold">7. Conservación</h2>
          <p>
            Conservamos tus datos mientras mantengas una cuenta activa. Podés solicitar
            la eliminación de tu cuenta y datos asociados contactándonos.
          </p>

          <h2 className="text-lg font-semibold">8. Tus derechos</h2>
          <p>
            Podés acceder, rectificar o suprimir tus datos personales escribiendo a{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary underline">
              {supportEmail}
            </a>
            . También podés presentar un reclamo ante la AAIP.
          </p>

          <h2 className="text-lg font-semibold">9. Contacto</h2>
          <p>
            Consultas sobre privacidad:{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary underline">
              {supportEmail}
            </a>
          </p>
        </section>

        <Link href="/" className="text-sm text-primary hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
