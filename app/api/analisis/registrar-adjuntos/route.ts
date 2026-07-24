import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import {
  isAllowedAdjuntoMime,
  resolveAdjuntoMime,
} from "@/lib/adjuntos/constants";

export const runtime = "nodejs";

interface RegistrarAdjuntosBody {
  expedienteId?: string;
  adjuntos?: Array<{
    id: string;
    storagePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export async function POST(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as RegistrarAdjuntosBody;
  const expedienteId = body.expedienteId?.trim();
  const adjuntos = body.adjuntos ?? [];

  if (!expedienteId || adjuntos.length === 0) {
    return json({ error: "Datos incompletos" }, { status: 400 });
  }

  const rows = [];
  for (const adj of adjuntos) {
    const mime = resolveAdjuntoMime({ name: adj.fileName, type: adj.mimeType });
    if (!mime || !isAllowedAdjuntoMime(mime)) {
      return json({ error: `Archivo no válido: ${adj.fileName}` }, { status: 400 });
    }

    if (!adj.storagePath.startsWith(`${user.id}/${expedienteId}/`)) {
      return json({ error: "Ruta de archivo inválida" }, { status: 400 });
    }

    rows.push({
      id: adj.id,
      expediente_id: expedienteId,
      user_id: user.id,
      nombre_original: adj.fileName,
      storage_path: adj.storagePath,
      mime_type: mime,
      tamano_bytes: adj.fileSize,
    });
  }

  const { error } = await supabase.from("expediente_adjuntos").insert(rows as never);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ adjuntoIds: rows.map((r) => r.id) }, { status: 201 });
}
