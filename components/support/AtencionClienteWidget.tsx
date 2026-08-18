"use client";

import Image from "next/image";
import { useState } from "react";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "soporte@fastcedu.app";

const SUPPORT_IMAGE = "/atencion-cliente.png";

interface AtencionClienteWidgetProps {
  userEmail: string;
}

export default function AtencionClienteWidget({
  userEmail,
}: AtencionClienteWidgetProps) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function resetModal() {
    setOpen(false);
    setMensaje("");
    setFeedback(null);
    setCopied(false);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback({
        type: "error",
        text: `No pudimos copiar el email. Escribilo manualmente: ${SUPPORT_EMAIL}`,
      });
    }
  }

  async function enviarConsulta() {
    const trimmed = mensaje.trim();
    if (trimmed.length < 10) {
      setFeedback({
        type: "error",
        text: "Contanos un poco más sobre el error o la consulta (mínimo 10 caracteres).",
      });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          pageUrl: window.location.pathname + window.location.search,
        }),
      });

      const data = (await res.json()) as {
        message?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (data.code === "SUPPORT_NOT_CONFIGURED") {
          setFeedback({
            type: "error",
            text: `El envío automático no está activo. Si acabás de configurar Vercel, hacé redeploy y probá de nuevo. También podés escribirnos a ${SUPPORT_EMAIL}.`,
          });
          return;
        }
        setFeedback({
          type: "error",
          text: data.error ?? "No se pudo enviar la consulta.",
        });
        return;
      }

      setFeedback({
        type: "success",
        text: data.message ?? "Recibimos tu consulta. Te responderemos pronto.",
      });
      setMensaje("");
    } catch {
      setFeedback({
        type: "error",
        text: "Error de conexión. Verificá tu internet e intentá de nuevo.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
        <div className="group relative">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setFeedback(null);
            }}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 bg-white shadow-lg ring-2 ring-primary/10 hover:ring-primary/25 hover:scale-105 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-1.5"
            aria-label="Atención al cliente"
          >
            <Image
              src={SUPPORT_IMAGE}
              alt=""
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 text-white text-xs font-medium px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            Atención al cliente
          </span>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atencion-title"
          onClick={resetModal}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 shrink-0 bg-white p-1">
                <Image
                  src={SUPPORT_IMAGE}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </span>
              <div>
                <h2 id="atencion-title" className="font-semibold text-gray-900">
                  Atención al cliente
                </h2>
                <p className="text-sm text-muted mt-1">
                  ¿Encontraste un error o necesitás ayuda? Contanos qué pasó y te
                  respondemos a{" "}
                  <span className="text-gray-900">{userEmail}</span>.
                </p>
              </div>
            </div>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              disabled={sending}
              placeholder="Ej.: Error al generar escrito, pago no acreditado, duda sobre el análisis…"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-60"
            />

            {feedback && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  feedback.type === "success"
                    ? "bg-accent/25 border border-accent text-gray-900"
                    : "bg-red-50 text-danger"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={resetModal}
                disabled={sending}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-background disabled:opacity-60"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => void enviarConsulta()}
                disabled={sending}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-60"
              >
                {sending ? "Enviando…" : "Enviar consulta"}
              </button>
            </div>

            <div className="rounded-lg border border-border bg-background px-3 py-2 space-y-2">
              <p className="text-xs text-muted">
                Si el envío falla, escribinos a:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-900 break-all">
                  {SUPPORT_EMAIL}
                </span>
                <button
                  type="button"
                  onClick={() => void copyEmail()}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-card"
                >
                  {copied ? "Copiado" : "Copiar email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
