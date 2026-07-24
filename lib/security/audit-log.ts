import { createServiceClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "document.upload"
  | "document.download"
  | "document.generate_ai"
  | "payment.checkout";

export interface AuditLogInput {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}

function extractClientIp(request?: Request): string | null {
  if (!request) return null;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

/** Registra evento de auditoría (best-effort; no bloquea la operación principal). */
export async function logSecurityEvent(input: AuditLogInput): Promise<void> {
  try {
    const admin = createServiceClient();
    await admin.from("security_audit_log").insert({
      user_id: input.userId ?? null,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      metadata: input.metadata ?? {},
      ip_address: extractClientIp(input.request),
      user_agent: input.request?.headers.get("user-agent") ?? null,
    } as never);
  } catch (err) {
    console.error("[security/audit-log]", err);
  }
}
