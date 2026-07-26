import Link from "next/link";

interface DisclaimerGeneradorProps {
  /** compact = una línea; full = párrafo completo */
  variant?: "compact" | "full";
  className?: string;
}

export default function DisclaimerGenerador({
  variant = "full",
  className = "",
}: DisclaimerGeneradorProps) {
  if (variant === "compact") {
    return (
      <p className={`text-xs text-muted ${className}`}>
        Borrador asistido por IA — revisá el contenido antes de presentarlo.{" "}
        <Link href="/privacidad" className="text-primary hover:underline">
          Términos
        </Link>
      </p>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg bg-background border border-border text-xs text-muted leading-relaxed ${className}`}
      role="note"
    >
      <p className="font-medium text-gray-900 mb-1">Revisión profesional obligatoria</p>
      <p>
        Fast Cedu es un asistente de redacción. La IA puede omitir datos, citar
        normas incorrectas o usar un formato procesal inadecuado. Vos sos el único
        responsable de verificar juzgado, partes, plazos y texto antes de
        notificar o presentar el escrito.
      </p>
      <p className="mt-1.5">
        <Link href="/privacidad" className="text-primary hover:underline">
          Política de privacidad y términos
        </Link>
      </p>
    </div>
  );
}
