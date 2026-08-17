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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

  const messageText = input.message.trim();
  const metaLines = [`Usuario: ${input.userEmail}`];
  if (input.pageUrl) metaLines.push(`Página: ${input.pageUrl}`);
  if (input.userAgent) metaLines.push(`Navegador: ${input.userAgent}`);

  const textBody = [messageText, "", "---", ...metaLines].join("\n");

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
      <h2 style="color:#003785;margin:0 0 12px">Nueva consulta — Fast Cedu</h2>
      <p style="white-space:pre-wrap;background:#f3faff;border:1px solid #cce9f9;border-radius:8px;padding:12px">${escapeHtml(messageText)}</p>
      <table style="margin-top:16px;font-size:14px;color:#525252">
        <tr><td style="padding:4px 12px 4px 0"><strong>Usuario</strong></td><td>${escapeHtml(input.userEmail)}</td></tr>
        ${input.pageUrl ? `<tr><td style="padding:4px 12px 4px 0"><strong>Página</strong></td><td>${escapeHtml(input.pageUrl)}</td></tr>` : ""}
      </table>
      <p style="margin-top:20px;font-size:13px;color:#525252">Respondé directamente a este correo para contactar al usuario.</p>
    </div>
  `.trim();

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
      subject: `[Fast Cedu] Consulta de ${input.userEmail}`,
      text: textBody,
      html: htmlBody,
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
