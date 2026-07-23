import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActualizarMembreteRequest } from "@/types";

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
    .select(
      "full_name, estudio_nombre, matricula, domicilio_profesional, telefono, ciudad"
    )
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

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: body.full_name.trim(),
      estudio_nombre: body.estudio_nombre?.trim() || null,
      matricula: body.matricula.trim(),
      domicilio_profesional: body.domicilio_profesional?.trim() || null,
      telefono: body.telefono?.trim() || null,
      ciudad: body.ciudad?.trim() || null,
    } as never)
    .eq("id", user.id)
    .select(
      "full_name, estudio_nombre, matricula, domicilio_profesional, telefono, ciudad"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ membrete: data });
}
