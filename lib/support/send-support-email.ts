import { getSupportFromEmail, getSupportInboxEmail } from "./config";

export class SupportEmailError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502
  ) {
    super(message);
    this.name = "SupportEmailError";
  }
}

export async function sendSupportEmail(input: {
  userEmail: string;
  message: string;
  pageUrl?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const inbox = getSupportInboxEmail();

  if (!apiKey || !inbox) {
    throw new SupportEmailError(
      "El envío de consultas no está configurado en el servidor.",
      503
    );
  }

  const lines = [
    input.message.trim(),
    "",
    "---",
    `Usuario: ${input.userEmail}`,
  ];

  if (input.pageUrl) {
    lines.push(`Página: ${input.pageUrl}`);
  }
  if (input.userAgent) {
    lines.push(`Navegador: ${input.userAgent}`);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getSupportFromEmail(),
      to: [inbox],
      reply_to: input.userEmail,
      subject: `Fast Cedu — Consulta de ${input.userEmail}`,
      text: lines.join("\n"),
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = (await response.json()) as { message?: string };
      detail = payload.message ? `: ${payload.message}` : "";
    } catch {
      /* ignore */
    }
    throw new SupportEmailError(
      `No se pudo enviar la consulta${detail}`,
      502
    );
  }
}
