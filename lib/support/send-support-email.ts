import { getSupportFromEmail, getSupportInboxEmail, getResendApiKey } from "./config";

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
  userName?: string | null;
  userId?: string;
  message: string;
  pageUrl?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const apiKey = getResendApiKey();
  const inbox = getSupportInboxEmail();

  if (!apiKey || !inbox) {
    throw new SupportEmailError(
      "El envío de consultas no está configurado en el servidor.",
      503
    );
  }

  const messageText = input.message.trim();
  const userLabel = input.userName
    ? `${input.userName} <${input.userEmail}>`
    : input.userEmail;

  const metaLines = [
    `Email registrado: ${input.userEmail}`,
    input.userName ? `Nombre: ${input.userName}` : "",
    input.userId ? `ID usuario: ${input.userId}` : "",
    input.pageUrl ? `Página: ${input.pageUrl}` : "",
    input.userAgent ? `Navegador: ${input.userAgent}` : "",
  ].filter(Boolean);

  const textBody = [
    `Consulta de: ${userLabel}`,
    "",
    messageText,
    "",
    "---",
    ...metaLines,
    "",
    "Respondé a este correo para escribirle al usuario (Reply-To configurado).",
  ].join("\n");

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <h2 style="color:#003785;margin:0 0 16px">Nueva consulta — Fast Cedu</h2>
      <div style="background:#003785;color:#fff;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <p style="margin:0;font-size:12px;opacity:0.85;text-transform:uppercase;letter-spacing:0.04em">Usuario registrado</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:600">${escapeHtml(input.userEmail)}</p>
        ${input.userName ? `<p style="margin:4px 0 0;font-size:14px;opacity:0.9">${escapeHtml(input.userName)}</p>` : ""}
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#525252;font-weight:600">Mensaje:</p>
      <p style="white-space:pre-wrap;background:#f3faff;border:1px solid #cce9f9;border-radius:8px;padding:12px;margin:0">${escapeHtml(messageText)}</p>
      <table style="margin-top:16px;font-size:13px;color:#525252">
        ${input.userId ? `<tr><td style="padding:4px 12px 4px 0"><strong>ID</strong></td><td style="font-family:monospace;font-size:12px">${escapeHtml(input.userId)}</td></tr>` : ""}
        ${input.pageUrl ? `<tr><td style="padding:4px 12px 4px 0"><strong>Página</strong></td><td>${escapeHtml(input.pageUrl)}</td></tr>` : ""}
      </table>
      <p style="margin-top:20px;font-size:13px;color:#525252">Usá <strong>Responder</strong> en Gmail para contactar a <strong>${escapeHtml(input.userEmail)}</strong>.</p>
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
      subject: `[Fast Cedu] ${input.userEmail} — consulta de soporte`,
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
