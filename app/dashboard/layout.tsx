import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

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

  return (
    <DashboardShell userEmail={user.email ?? ""}>{children}</DashboardShell>
  );
}
