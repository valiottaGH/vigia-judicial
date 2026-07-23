import { redirect } from "next/navigation";
import SessionGuard from "@/components/auth/SessionGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import {
  effectivePlanId,
  parseSubscriptionStatus,
} from "@/lib/subscription/entitlements";
import { getPlan } from "@/lib/subscription/plans";
import { isProfileAdmin } from "@/lib/auth/admin";

async function requireDashboardUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const metaAccepted = user.user_metadata?.disclaimer_accepted_at as
    | string
    | undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select("disclaimer_accepted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!(profile?.disclaimer_accepted_at ?? metaAccepted)) {
    redirect("/onboarding");
  }

  return user;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDashboardUser();

  const supabase = await createClient();
  const { data: profilePlan } = await supabase
    .from("profiles")
    .select("plan, subscription_status, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = await isProfileAdmin(supabase, user.id, user.email);

  const effectivePlan = effectivePlanId(
    profilePlan?.plan,
    parseSubscriptionStatus(profilePlan?.subscription_status)
  );
  const planLabel = getPlan(effectivePlan).nombre;

  return (
    <SessionGuard>
      <DashboardShell
        userEmail={user.email ?? ""}
        planLabel={planLabel}
        isAdmin={isAdmin}
      >
        {children}
      </DashboardShell>
    </SessionGuard>
  );
}
