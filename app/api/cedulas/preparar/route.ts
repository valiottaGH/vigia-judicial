import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { buildAdjuntoStoragePath } from "@/lib/adjuntos/storage";
import type { ExpedienteActuaciones } from "@/lib/actuaciones/types";

export const runtime = "nodejs";

interface PrepararBody {
  numero?: string;
  caratula?: string;
  fileName?: string;
}

export async function POST(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: PrepararBody;
  try {
    body = (await request.json()) as PrepararBody;
  } catch {
    return json({ error: "JSON inválido" }, { status: 400 });
  }

  const numero = body.numero?.trim() ?? "";
  const caratula = body.caratula?.trim() ?? "";
  const fileName = body.fileName?.trim() ?? "documento.pdf";

  if (!numero || !caratula) {
    return json(
      { error: "Número y carátula son obligatorios" },
      { status: 400 }
    );
  }

  const { data: existente } = await supabase
    .from("expedientes")
    .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
    .eq("user_id", user.id)
    .eq("numero", numero)
    .maybeSingle();

  let expediente: ExpedienteActuaciones;

  if (existente) {
    await supabase
      .from("expedientes")
      .update({ caratula } as never)
      .eq("id", existente.id);
    expediente = { ...existente, caratula } as ExpedienteActuaciones;
  } else {
    const { data: creado, error: createError } = await supabase
      .from("expedientes")
      .insert({
        user_id: user.id,
        numero,
        caratula,
        jurisdiccion: "Santa Fe",
      } as never)
      .select("id, numero, caratula, jurisdiccion, juzgado, fuero")
      .single();

    if (createError || !creado) {
      return json(
        { error: createError?.message ?? "Error al crear expediente" },
        { status: 500 }
      );
    }
    expediente = creado as ExpedienteActuaciones;
  }

  const adjuntoId = crypto.randomUUID();
  const storagePath = buildAdjuntoStoragePath({
    userId: user.id,
    expedienteId: expediente.id,
    adjuntoId,
    fileName,
  });

  return json({
    expedienteId: expediente.id,
    adjuntoId,
    storagePath,
  });
}
