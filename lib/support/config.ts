function firstAdminEmail(): string | null {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return null;
  const first = raw.split(",").map((e) => e.trim()).find(Boolean);
  return first ?? null;
}

/** Bandeja donde llegan consultas del widget (tu Gmail). */
export function getSupportInboxEmail(): string | null {
  const inbox =
    process.env.SUPPORT_INBOX_EMAIL?.trim() ||
    process.env.RESEND_DEV_TO?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    firstAdminEmail();
  return inbox || null;
}

export function getSupportFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || "Fast Cedu <onboarding@resend.dev>"
  );
}

export function isSupportEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && getSupportInboxEmail()
  );
}
