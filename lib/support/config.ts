function cleanEnv(value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^["']|["']$/g, "") || null;
}

function firstAdminEmail(): string | null {
  const raw = cleanEnv(process.env.ADMIN_EMAILS);
  if (!raw) return null;
  const first = raw.split(",").map((e) => e.trim()).find(Boolean);
  return first ?? null;
}

/** Bandeja donde llegan consultas del widget (tu Gmail). */
export function getSupportInboxEmail(): string | null {
  const inbox =
    cleanEnv(process.env.SUPPORT_INBOX_EMAIL) ||
    cleanEnv(process.env.RESEND_DEV_TO) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) ||
    firstAdminEmail();
  return inbox || null;
}

export function getSupportFromEmail(): string {
  return cleanEnv(process.env.RESEND_FROM_EMAIL) || "Fast Cedu <onboarding@resend.dev>";
}

export function getResendApiKey(): string | null {
  return cleanEnv(process.env.RESEND_API_KEY);
}

export function isSupportEmailConfigured(): boolean {
  return Boolean(getResendApiKey() && getSupportInboxEmail());
}

export function getSupportConfigStatus(): {
  configured: boolean;
  hasResendKey: boolean;
  hasInbox: boolean;
  inboxEmail: string | null;
  fromEmail: string;
} {
  const inboxEmail = getSupportInboxEmail();
  return {
    configured: isSupportEmailConfigured(),
    hasResendKey: Boolean(getResendApiKey()),
    hasInbox: Boolean(inboxEmail),
    inboxEmail,
    fromEmail: getSupportFromEmail(),
  };
}
