import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { buildPlantillaStoragePath } from "@/lib/plantillas-cedula/storage";

export const runtime = "nodejs";

interface PrepararBody {
  fileName?: string;
}

export async function POST(request: NextRequest) {
  const { withSessionCookies, getUser } = createSupabaseRouteClient(request);
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

  const fileName = body.fileName?.trim() || "plantilla.docx";
  const plantillaId = crypto.randomUUID();
  const storagePath = buildPlantillaStoragePath({
    userId: user.id,
    plantillaId,
    fileName,
  });

  return json({ plantillaId, storagePath });
}
