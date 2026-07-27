/** Bandeja donde llegan consultas de soporte (tu Gmail u otro). */
export function getSupportInboxEmail(): string | null {
  const inbox =
    process.env.SUPPORT_INBOX_EMAIL?.trim() ||
    process.env.RESEND_DEV_TO?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
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
