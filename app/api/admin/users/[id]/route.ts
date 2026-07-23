import { NextResponse } from "next/server";
import { isAdminResult, requireAdmin } from "@/lib/auth/admin";
import type { PlanId, SubscriptionStatus } from "@/lib/subscription/plans";

type RouteContext = { params: Promise<{ id: string }> };

interface PatchBody {
  plan?: PlanId;
  subscription_status?: SubscriptionStatus;
  subscription_ends_at?: string | null;
  is_admin?: boolean;
}

const VALID_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "canceled",
  "past_due",
  "none",
];

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!isAdminResult(auth)) return auth;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.plan !== undefined) {
    const allowed: PlanId[] = ["free", "pro", "business"];
    if (!allowed.includes(body.plan)) {
      return NextResponse.json({ error: "Plan invalido" }, { status: 400 });
    }
    updates.plan = body.plan;
  }

  if (body.subscription_status !== undefined) {
    if (!VALID_STATUSES.includes(body.subscription_status)) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
    }
    updates.subscription_status = body.subscription_status;
  }

  if (body.subscription_ends_at !== undefined) {
    updates.subscription_ends_at = body.subscription_ends_at;
  }

  if (body.is_admin !== undefined) {
    if (body.is_admin === false && id === auth.user.id) {
      return NextResponse.json(
        { error: "No podes quitarte el rol admin a vos mismo" },
        { status: 400 }
      );
    }
    updates.is_admin = body.is_admin;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("profiles")
    .update(updates as never)
    .eq("id", id)
    .select(
      "id, email, full_name, plan, subscription_status, subscription_ends_at, is_admin, created_at"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user: data });
}
