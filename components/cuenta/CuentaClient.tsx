"use client";

import { useSearchParams } from "next/navigation";
import AccountForm from "./AccountForm";
import PasswordForm from "./PasswordForm";
import SubscriptionPanel from "./SubscriptionPanel";
import type { AccountProfile } from "@/types";
import type { PlanId, SubscriptionStatus } from "@/lib/subscription/plans";
import type { AiQuota } from "@/lib/subscription/entitlements";

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "seguridad", label: "Seguridad" },
  { id: "suscripcion", label: "Suscripcion" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CuentaClient({
  email,
  profile,
  plan,
  subscriptionStatus,
  subscriptionEndsAt,
  aiQuota,
}: {
  email: string;
  profile: AccountProfile | null;
  plan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: string | null;
  aiQuota: AiQuota;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId =
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "perfil";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={`/dashboard/cuenta?tab=${tab.id}`}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              activeTab === tab.id ? "bg-primary text-white" : "text-muted hover:bg-background"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {activeTab === "perfil" && (
        <section className="max-w-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de cuenta</h2>
          <AccountForm initial={profile} email={email} />
        </section>
      )}

      {activeTab === "seguridad" && (
        <section className="max-w-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h2>
          <PasswordForm email={email} />
        </section>
      )}

      {activeTab === "suscripcion" && (
        <section className="max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Suscripcion</h2>
          <SubscriptionPanel
            plan={plan}
            status={subscriptionStatus}
            endsAt={subscriptionEndsAt}
            aiQuota={aiQuota}
            paymentNotice={
              (searchParams.get("payment") as
                | "success"
                | "failure"
                | "pending"
                | null) ?? null
            }
          />
        </section>
      )}
    </div>
  );
}
