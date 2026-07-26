import { redirect } from "next/navigation";

/** Ruta legacy: la generación de escritos vive dentro del análisis. */
export default function GenerarEscritoPage() {
  redirect("/dashboard/analisis");
}
