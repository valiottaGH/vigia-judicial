import { NextResponse } from "next/server";
import { isAdminResult, requireAdmin } from "@/lib/auth/admin";
import { getPlan, parsePlanId, type PlanId } from "@/lib/subscription/plans";
import { parseSubscriptionStatus } from "@/lib/subscription/entitlements";

export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminResult(auth)) return auth;

  const { data, error } = await auth.service
    .from("profiles")
    .select(
      "id, email, full_name, plan, subscription_status, subscription_ends_at, is_admin, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data ?? []).map((row) => ({
    ...row,
    plan: parsePlanId(row.plan),
    plan_nombre: getPlan(parsePlanId(row.plan)).nombre,
    subscription_status: parseSubscriptionStatus(row.subscription_status),
  }));

  return NextResponse.json({ users });
}

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanId;
  subscription_status: string;
  subscription_ends_at: string | null;
  is_admin: boolean;
  created_at: string;
};
