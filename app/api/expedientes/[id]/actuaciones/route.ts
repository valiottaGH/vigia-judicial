import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ParteExpediente, Resolucion } from "@/lib/actuaciones/types";

type RouteContext = { params: Promise<{ id: string }> };

/** Datos del expediente para la pantalla de actuaciones. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: expediente, error } = await supabase
    .from("expedientes")
    .select("id, numero, caratula, jurisdiccion, juzgado, fuero, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !expediente) {
    return NextResponse.json(
      { error: "Expediente no encontrado" },
      { status: 404 }
    );
  }

  const { data: partes } = await supabase
    .from("partes_expediente")
    .select("*")
    .eq("expediente_id", id)
    .order("created_at", { ascending: true });

  const { data: resoluciones } = await supabase
    .from("resoluciones")
    .select("*")
    .eq("expediente_id", id)
    .order("fecha", { ascending: false });

  const { data: actuaciones } = await supabase
    .from("actuaciones_generadas")
    .select("id, tipo_actuacion, documentos_count, zip_url, created_at, jurisdiccion, plantilla_key")
    .eq("expediente_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    expediente,
    partes: (partes ?? []) as ParteExpediente[],
    resoluciones: (resoluciones ?? []) as Resolucion[],
    actuaciones: actuaciones ?? [],
  });
}

/** Crear parte o resolución rápida desde la UI de actuaciones. */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: expediente } = await supabase
    .from("expedientes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!expediente) {
    return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
  }

  const body = (await request.json()) as {
    tipo: "parte" | "resolucion";
    parte?: {
      nombre: string;
      apellido: string;
      rol: string;
      domicilio?: string;
    };
    resolucion?: {
      fecha: string;
      texto: string;
      tipo?: string;
    };
  };

  if (body.tipo === "parte" && body.parte) {
    const { data, error } = await supabase
      .from("partes_expediente")
      .insert({
        expediente_id: id,
        nombre: body.parte.nombre,
        apellido: body.parte.apellido,
        rol: body.parte.rol,
        domicilio: body.parte.domicilio ?? null,
      } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ parte: data });
  }

  if (body.tipo === "resolucion" && body.resolucion) {
    const { data, error } = await supabase
      .from("resoluciones")
      .insert({
        expediente_id: id,
        fecha: body.resolucion.fecha,
        texto: body.resolucion.texto,
        tipo: body.resolucion.tipo ?? "proveido",
      } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ resolucion: data });
  }

  return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
}
