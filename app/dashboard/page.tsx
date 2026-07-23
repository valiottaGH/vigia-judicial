import { createClient } from "@/lib/supabase/server";
import GeneradorCedulasPage from "@/components/cedulas/GeneradorCedulasPage";
import { isAiConfigured } from "@/lib/ai/config";
import { isMembreteCompleto } from "@/lib/profile/membrete";
import {
  getUserAiQuota,
  parseSubscriptionStatus,
} from "@/lib/subscription/entitlements";
import { getPlan } from "@/lib/subscription/plans";
import { isProfileAdmin } from "@/lib/auth/admin";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, matricula, plan, subscription_status, is_admin")
    .eq("id", user!.id)
    .maybeSingle();

  const membreteCompleto = isMembreteCompleto(profile);
  const subscriptionStatus = parseSubscriptionStatus(
    profile?.subscription_status
  );
  const isAdmin = await isProfileAdmin(supabase, user!.id, user!.email);
  const aiQuota = await getUserAiQuota(
    supabase,
    user!.id,
    profile?.plan,
    subscriptionStatus,
    { isAdmin }
  );
  const planNombre = getPlan(aiQuota.effectivePlan).nombre;

  return (
    <GeneradorCedulasPage
      aiDisponible={isAiConfigured()}
      membreteCompleto={membreteCompleto}
      planNombre={planNombre}
      aiQuota={aiQuota}
    />
  );
}
