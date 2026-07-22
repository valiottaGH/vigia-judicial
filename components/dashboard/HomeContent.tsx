import Link from "next/link";

const SECTIONS = [
  {
    title: "Escritos",
    href: "/dashboard/escritos",
    description:
      "Redacta escritos judiciales con plantillas, editor rich-text y exportacion a PDF.",
    steps: [
      "Anda a Escritos → Nuevo escrito.",
      "Elegi el tipo (demanda, contestacion, memorial, etc.).",
      "Usa plantilla fija o Generar con IA (si tenes OPENAI_API_KEY).",
      "Completa los placeholders ([Caratula], [Expediente], etc.).",
      "Exporta PDF desde el editor (en movil, barra inferior).",
    ],
  },
  {
    title: "Expedientes",
    href: "/dashboard/expedientes",
    description:
      "Registro de causas y generacion masiva de actuaciones (cedulas, oficios, etc.).",
    steps: [
      "Agrega expedientes con numero, jurisdiccion y caratula.",
      "Entra a Generar actuaciones en cada causa para crear el paquete de documentos.",
    ],
  },
  {
    title: "Configuracion",
    href: "/dashboard/configuracion",
    description:
      "Membrete del estudio: nombre, matricula CPASF, domicilio y telefono.",
    steps: [
      "Completa tus datos una vez.",
      "Se aplican automaticamente en plantillas y en el PDF.",
    ],
  },
  {
    title: "Mi cuenta",
    href: "/dashboard/cuenta?tab=perfil",
    description: "Perfil, contrasena, suscripcion y cerrar sesion.",
    steps: [
      "Menu (arriba a la derecha) → Mi cuenta o Suscripcion.",
      "Podes iniciar sesion con Google o email y contrasena.",
    ],
  },
];

export default function HomeContent() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Bienvenido a Vigia Judicial
        </h1>
        <p className="text-muted mt-2 leading-relaxed">
          Herramienta para abogados en Santa Fe: redactar escritos, exportar PDF y
          organizar expedientes. Esta guia resume como usar cada seccion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickCard label="1. Configura membrete" href="/dashboard/configuracion" />
        <QuickCard label="2. Crea un escrito" href="/dashboard/escritos/nuevo" />
        <QuickCard label="3. Exporta PDF" href="/dashboard/escritos" />
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="bg-card border border-border rounded-xl p-5 md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-primary">{section.title}</h2>
              <Link
                href={section.href}
                className="text-sm text-primary font-medium hover:underline"
              >
                Ir →
              </Link>
            </div>
            <p className="text-sm text-muted mb-4">{section.description}</p>
            <ol className="space-y-2">
              {section.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm">
        <p className="font-medium text-primary">Generacion con IA (opcional)</p>
        <p className="text-muted mt-1">
          Si configuras <code className="text-xs">OPENAI_API_KEY</code> en el servidor,
          podes generar borradores en Nuevo escrito o Regenerar con IA en el editor.
          Siempre revisa el texto antes de presentar.
        </p>
      </div>
    </div>
  );
}

function QuickCard({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="block p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition text-sm font-medium text-primary text-center"
    >
      {label}
    </Link>
  );
}
