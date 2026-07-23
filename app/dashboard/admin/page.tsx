import { redirect } from "next/navigation";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import { isProfileAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await isProfileAdmin(supabase, user.id, user.email);
  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Administracion</h1>
        <p className="text-sm text-muted mt-1">
          Gestioná el plan y el estado de cada usuario registrado.
        </p>
      </div>
      <AdminUsersPanel />
    </div>
  );
}
