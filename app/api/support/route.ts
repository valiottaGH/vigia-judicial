import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { isSupportEmailConfigured } from "@/lib/support/config";
import {
  sendSupportEmail,
  SupportEmailError,
} from "@/lib/support/send-support-email";

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 4000;

interface SupportBody {
  message?: string;
  pageUrl?: string;
}

export async function POST(request: Request) {
  if (!isSupportEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "El formulario de soporte aún no está configurado. Escribinos copiando el email que ves abajo.",
        code: "SUPPORT_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: rateLimitKey("support", request, user.id),
    limit: 8,
    windowSeconds: 3600,
  });

  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds ?? 3600);
  }

  let body: SupportBody;
  try {
    body = (await request.json()) as SupportBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (message.length < MIN_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        error: `Contanos un poco más (mínimo ${MIN_MESSAGE_LENGTH} caracteres).`,
      },
      { status: 400 }
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "El mensaje es demasiado largo." },
      { status: 400 }
    );
  }

  const pageUrl = body.pageUrl?.trim() || null;
  if (
    pageUrl &&
    (pageUrl.length > 500 ||
      (!pageUrl.startsWith("/") && !pageUrl.startsWith("http")))
  ) {
    return NextResponse.json({ error: "URL de página inválida" }, { status: 400 });
  }

  try {
    await sendSupportEmail({
      userEmail: user.email,
      message,
      pageUrl,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (err) {
    if (err instanceof SupportEmailError) {
      console.error("[api/support]", err.message);
      return NextResponse.json(
        { error: err.message, code: "SUPPORT_SEND_FAILED" },
        { status: err.statusCode }
      );
    }
    console.error("[api/support]", err);
    return NextResponse.json(
      { error: "No se pudo enviar la consulta. Intentá de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Recibimos tu consulta. Te responderemos a ${user.email}.`,
  });
}
