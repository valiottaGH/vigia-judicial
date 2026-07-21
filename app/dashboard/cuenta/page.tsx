import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CuentaClient from "@/components/cuenta/CuentaClient";
import type { AccountProfile } from "@/types";
import type { PlanId, SubscriptionStatus } from "@/lib/subscription/plans";

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, notifications_email, plan, subscription_status, subscription_ends_at"
    )
    .eq("id", user!.id)
    .maybeSingle();

  const p = profile as AccountProfile | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Mi cuenta</h1>
        <p className="text-sm text-muted mt-1">
          Perfil, seguridad y suscripcion.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Cargando...</p>}>
        <CuentaClient
          email={user!.email ?? ""}
          profile={p}
          plan={(p?.plan as PlanId) ?? "free"}
          subscriptionStatus={
            (p?.subscription_status as SubscriptionStatus) ?? "active"
          }
          subscriptionEndsAt={p?.subscription_ends_at ?? null}
        />
      </Suspense>
    </div>
  );
}
