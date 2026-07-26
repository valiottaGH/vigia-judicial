import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActualizarMembreteRequest } from "@/types";
import { PERFIL_ESCRITO_SELECT } from "@/lib/profile/perfil-escrito";

const CARACTER_VALIDOS = new Set(["propio", "apoderado", "patrocinante"]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PERFIL_ESCRITO_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ membrete: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as ActualizarMembreteRequest;

  if (!body.full_name?.trim() || !body.matricula?.trim()) {
    return NextResponse.json(
      { error: "Nombre y matrícula son obligatorios." },
      { status: 400 }
    );
  }

  const caracter = body.caracter?.trim();
  const caracterFinal =
    caracter && CARACTER_VALIDOS.has(caracter) ? caracter : null;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: body.full_name.trim(),
      estudio_nombre: body.estudio_nombre?.trim() || null,
      matricula: body.matricula.trim(),
      matricula_tomo: body.matricula_tomo?.trim() || null,
      matricula_folio: body.matricula_folio?.trim() || null,
      cuit_cuil: body.cuit_cuil?.trim() || null,
      caracter: caracterFinal,
      domicilio_electronico: body.domicilio_electronico?.trim() || null,
      domicilio_profesional: body.domicilio_profesional?.trim() || null,
      telefono: body.telefono?.trim() || null,
      ciudad: body.ciudad?.trim() || null,
    } as never)
    .eq("id", user.id)
    .select(PERFIL_ESCRITO_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ membrete: data });
}
