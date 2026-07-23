import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

function adminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().includes(email.toLowerCase());
}

export async function isProfileAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
  email?: string | null
): Promise<boolean> {
  if (isAdminEmail(email)) return true;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(data?.is_admin);
}

export async function requireAdmin(): Promise<
  | { user: User; supabase: SupabaseClient<Database>; service: ReturnType<typeof createServiceClient> }
  | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await isProfileAdmin(supabase, user.id, user.email);
  if (!admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  return { user, supabase, service: createServiceClient() };
}

export function isAdminResult(
  result: Awaited<ReturnType<typeof requireAdmin>>
): result is {
  user: User;
  supabase: SupabaseClient<Database>;
  service: ReturnType<typeof createServiceClient>;
} {
  return !(result instanceof NextResponse);
}
