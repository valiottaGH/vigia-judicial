import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEscritoPdfBuffer } from "@/lib/escritos/generate-pdf";
import type { Escrito, MembreteProfile } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: escrito, error } = await supabase
    .from("escritos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!escrito) {
    return NextResponse.json({ error: "Escrito no encontrado" }, { status: 404 });
  }

  const row = escrito as Escrito;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as MembreteProfile | null;

  const buffer = await generateEscritoPdfBuffer({
    titulo: row.titulo,
    contenidoHtml: row.contenido_html,
    membrete: {
      estudio: profile?.estudio_nombre ?? profile?.full_name ?? "Estudio Juridico",
      abogado: profile?.full_name ?? "",
      matricula: profile?.matricula ?? "",
      domicilio: profile?.domicilio_profesional ?? "",
      telefono: profile?.telefono ?? "",
      ciudad: profile?.ciudad ?? "Santa Fe",
    },
  });

  const filename = `${row.titulo.replace(/[^\w\s-]/g, "").slice(0, 60)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
