import { redirect } from "next/navigation";
import CheckoutClient from "@/components/billing/CheckoutClient";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/config";
import { isPaidPlan, parsePlanId } from "@/lib/subscription/plans";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const planId = parsePlanId(params.plan);

  if (!isPaidPlan(planId)) {
    redirect("/dashboard/cuenta?tab=suscripcion");
  }

  const mpConfigured = isMercadoPagoConfigured();
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() ?? "";

  return (
    <div className="max-w-lg mx-auto">
      {!mpConfigured ? (
        <div className="p-4 rounded-xl bg-accent/25 border border-accent text-sm text-gray-900">
          Mercado Pago no esta configurado en el servidor. Agrega{" "}
          <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code> y{" "}
          <code className="text-xs">NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code> en{" "}
          <code className="text-xs">.env.local</code>.
        </div>
      ) : (
        <CheckoutClient planId={planId} publicKey={publicKey} />
      )}
    </div>
  );
}
