import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AdjuntoError,
  createAdjuntoSignedUrl,
  deleteAdjuntoFromStorage,
} from "@/lib/adjuntos/storage";

type RouteContext = { params: Promise<{ id: string; adjuntoId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: expedienteId, adjuntoId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: adjunto, error } = await supabase
    .from("expediente_adjuntos")
    .select("*")
    .eq("id", adjuntoId)
    .eq("expediente_id", expedienteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !adjunto) {
    return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
  }

  try {
    const download_url = await createAdjuntoSignedUrl(adjunto.storage_path);
    return NextResponse.json({ adjunto, download_url });
  } catch (err) {
    const msg = err instanceof AdjuntoError ? err.message : "Error de descarga";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: expedienteId, adjuntoId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: adjunto, error: fetchError } = await supabase
    .from("expediente_adjuntos")
    .select("storage_path")
    .eq("id", adjuntoId)
    .eq("expediente_id", expedienteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !adjunto) {
    return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
  }

  try {
    await deleteAdjuntoFromStorage(adjunto.storage_path);
  } catch (err) {
    const msg = err instanceof AdjuntoError ? err.message : "Error al eliminar archivo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("expediente_adjuntos")
    .delete()
    .eq("id", adjuntoId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
