import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AdjuntoError,
  createAdjuntoSignedUrl,
  uploadAdjuntoToStorage,
} from "@/lib/adjuntos/storage";
import type { ExpedienteAdjunto } from "@/lib/adjuntos/types";

type RouteContext = { params: Promise<{ id: string }> };

async function verifyExpedienteOwner(expedienteId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expedientes")
    .select("id")
    .eq("id", expedienteId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: expedienteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!(await verifyExpedienteOwner(expedienteId, user.id))) {
    return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("expediente_adjuntos")
    .select("*")
    .eq("expediente_id", expedienteId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ adjuntos: (data ?? []) as ExpedienteAdjunto[] });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: expedienteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!(await verifyExpedienteOwner(expedienteId, user.id))) {
    return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Falta el archivo (campo 'file')" },
        { status: 400 }
      );
    }

    const adjuntoId = crypto.randomUUID();
    const storagePath = await uploadAdjuntoToStorage({
      userId: user.id,
      expedienteId,
      adjuntoId,
      file,
    });

    const { data, error } = await supabase
      .from("expediente_adjuntos")
      .insert({
        id: adjuntoId,
        expediente_id: expedienteId,
        user_id: user.id,
        nombre_original: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        tamano_bytes: file.size,
      } as never)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let download_url: string | undefined;
    try {
      download_url = await createAdjuntoSignedUrl(storagePath);
    } catch {
      /* opcional */
    }

    return NextResponse.json(
      { adjunto: { ...data, download_url } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AdjuntoError) {
      const status = err.code === "TOO_LARGE" ? 413 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    const msg = err instanceof Error ? err.message : "Error al subir";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
