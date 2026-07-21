/**
 * POST /api/escritos/generate — borrador HTML con IA (OpenAI).
 * GET devuelve { configured: boolean } para mostrar u ocultar el panel en la UI.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generarEscritoHtml, isAiConfigured } from "@/lib/escritos/ai";
import type { MembreteProfile } from "@/types";

export async function GET() {
  return NextResponse.json({ configured: isAiConfigured() });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "IA no configurada. Agrega OPENAI_API_KEY en .env.local (ver docs/ESCRITOS-IA.md)",
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    tipo: string;
    instrucciones?: string;
    variables?: Record<string, string>;
  };

  if (!body.tipo?.trim()) {
    return NextResponse.json({ error: "Falta el tipo de escrito" }, { status: 400 });
  }

  if (!body.instrucciones?.trim()) {
    return NextResponse.json(
      { error: "Describe el caso o que debe decir el escrito" },
      { status: 400 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const membrete = profileData as MembreteProfile | null;

  try {
    const contenido_html = await generarEscritoHtml({
      tipo: body.tipo,
      instrucciones: body.instrucciones,
      variables: body.variables,
      membrete,
    });

    return NextResponse.json({ contenido_html });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al generar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
