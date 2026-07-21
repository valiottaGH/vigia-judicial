"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard/escritos", label: "Escritos" },
  { href: "/dashboard/expedientes", label: "Expedientes" },
  { href: "/dashboard/configuracion", label: "Configuracion" },
];

const USER_LINKS = [
  { href: "/dashboard/cuenta?tab=perfil", label: "Mi cuenta" },
  { href: "/dashboard/cuenta?tab=suscripcion", label: "Suscripcion" },
];

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/dashboard/escritos" className="font-bold text-primary text-lg">
            Vigia Judicial
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-background"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <UserFooter
          userEmail={userEmail}
          initials={initials}
          onLogout={() => void logout()}
          activePath={pathname}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-border p-4 flex items-center justify-between gap-2">
          <Link href="/dashboard/escritos" className="font-semibold text-primary">
            Vigia Judicial
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border text-sm"
            aria-expanded={mobileOpen}
            aria-label="Menu de usuario"
          >
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
              {initials}
            </span>
          </button>
        </header>

        {mobileOpen && (
          <div className="md:hidden border-b border-border bg-card p-3 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  pathname.startsWith(item.href)
                    ? "bg-primary text-white"
                    : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border my-2 pt-2">
              <p className="px-3 text-xs text-muted truncate mb-1">{userEmail}</p>
              {USER_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-muted hover:bg-background"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full text-left px-3 py-2 text-sm text-danger rounded-lg hover:bg-red-50"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function UserFooter({
  userEmail,
  initials,
  onLogout,
  activePath,
}: {
  userEmail: string;
  initials: string;
  onLogout: () => void;
  activePath: string;
}) {
  const isAccountActive = activePath.startsWith("/dashboard/cuenta");

  return (
    <div className="p-3 border-t border-border space-y-1">
      <div className="flex items-center gap-2 px-2 py-2 mb-1">
        <span className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="text-xs text-muted truncate">{userEmail}</span>
      </div>
      {USER_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block px-3 py-2 rounded-lg text-sm ${
            isAccountActive ? "text-primary font-medium" : "text-muted hover:bg-background"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="w-full text-left px-3 py-2 text-sm text-muted hover:text-danger rounded-lg"
      >
        Cerrar sesion
      </button>
    </div>
  );
}
