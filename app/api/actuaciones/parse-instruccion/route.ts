import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseInstruction } from "@/lib/actuaciones/instruction-parser";

/** Parsea instrucción en lenguaje natural sin generar documentos. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { instruccion?: string };

  if (!body.instruccion?.trim()) {
    return NextResponse.json(
      { error: "Ingrese una instrucción" },
      { status: 400 }
    );
  }

  const parsed = parseInstruction(body.instruccion);
  return NextResponse.json({ parsed });
}
