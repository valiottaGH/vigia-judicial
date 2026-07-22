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

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: body.full_name,
      estudio_nombre: body.estudio_nombre,
      matricula: body.matricula,
      domicilio_profesional: body.domicilio_profesional,
      telefono: body.telefono,
      ciudad: body.ciudad,
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
