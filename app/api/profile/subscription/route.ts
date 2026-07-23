import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePlanId, type PlanId } from "@/lib/subscription/plans";

interface SubscriptionBody {
  action: "cancel" | "change_plan";
  plan?: PlanId;
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as SubscriptionBody;

  if (body.action === "cancel") {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        plan: "free",
        subscription_status: "canceled",
        subscription_ends_at: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user.id)
      .select(
        "full_name, notifications_email, plan, subscription_status, subscription_ends_at"
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      account: data,
      message: "Suscripcion cancelada. Volviste al plan Gratis.",
    });
  }

  if (body.action === "change_plan") {
    const target = parsePlanId(body.plan);
    const allowed: PlanId[] = ["free", "pro", "business"];

    if (!body.plan || !allowed.includes(target)) {
      return NextResponse.json({ error: "Plan invalido" }, { status: 400 });
    }

    const updates =
      target === "free"
        ? {
            plan: "free",
            subscription_status: "canceled",
            subscription_ends_at: null,
          }
        : {
            plan: target,
            subscription_status: "active",
            subscription_ends_at: null,
          };

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq("id", user.id)
      .select(
        "full_name, notifications_email, plan, subscription_status, subscription_ends_at"
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      account: data,
      message: `Plan actualizado a ${target === "pro" ? "Pro" : target === "business" ? "Business" : "Gratis"}.`,
    });
  }

  return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
}
