import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: expedientes, error: expError } = await supabase
    .from("expedientes")
    .select("id")
    .eq("user_id", user.id);

  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }

  const expedienteIds = expedientes?.map((e) => e.id) ?? [];

  if (expedienteIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("novedades")
    .select("*, expedientes(numero, jurisdiccion, caratula)")
    .in("expediente_id", expedienteIds)
    .order("fecha", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, leida } = (await request.json()) as {
    id: string;
    leida: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("novedades")
    .update({ leida })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
