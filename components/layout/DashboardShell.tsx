"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppLogo from "@/components/layout/AppLogo";
import MembreteAlertBanner from "@/components/profile/MembreteAlertBanner";
import { createClient } from "@/lib/supabase/client";

const USER_LINKS = [
  { href: "/dashboard/configuracion", label: "Configuración" },
  { href: "/dashboard/cuenta?tab=perfil", label: "Mi cuenta" },
];

const MODULE_LINKS = [
  { href: "/dashboard/analisis", label: "Análisis IA" },
  { href: "/dashboard/generar", label: "Generar escrito" },
];

const ADMIN_LINK = { href: "/dashboard/admin", label: "Administración" };

export default function DashboardShell({
  children,
  userEmail,
  planLabel,
  isAdmin = false,
  membreteCompleto = true,
}: {
  children: React.ReactNode;
  userEmail: string;
  planLabel?: string;
  isAdmin?: boolean;
  membreteCompleto?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = userEmail.slice(0, 2).toUpperCase();
  const isHome =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/analisis") ||
    pathname.startsWith("/dashboard/generar");

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
        <div className="px-3 md:px-6 h-12 md:h-16 flex items-center justify-between gap-3 md:gap-4 max-w-4xl mx-auto w-full">
          <Link
            href="/dashboard/analisis"
            className={`inline-flex items-center shrink-0 rounded-lg border px-2 py-1 md:px-2.5 md:py-1.5 transition-all ${
              isHome
                ? "border-primary bg-primary shadow-sm"
                : "border-primary/60 bg-primary/5 hover:bg-primary/10 hover:border-primary"
            }`}
            aria-current={isHome ? "page" : undefined}
          >
            <AppLogo
              size="sm"
              showText
              textClassName={`text-sm md:text-base ${isHome ? "text-white" : "text-primary"}`}
            />
          </Link>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-1 md:gap-2 pl-1.5 pr-2 py-1 md:pl-2 md:pr-3 md:py-2 rounded-lg md:rounded-xl border md:border-2 text-sm font-medium transition-all h-9 md:h-auto md:min-h-[44px] ${
                menuOpen
                  ? "border-primary bg-primary text-white shadow-md"
                  : "border-primary/60 bg-primary/5 text-primary md:bg-primary/10"
              }`}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <span
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-[10px] md:text-xs font-bold flex items-center justify-center shrink-0 ${
                  menuOpen ? "bg-white/20 text-white" : "bg-primary text-white"
                }`}
              >
                {initials}
              </span>
              <ChevronIcon open={menuOpen} className="w-3.5 h-3.5 md:w-4 md:h-4 hidden md:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-2 z-40">
                <p className="px-4 py-2 text-xs text-muted truncate border-b border-border mb-1">
                  {userEmail}
                </p>
                {planLabel && (
                  <p className="px-4 pb-2 text-xs font-medium text-primary border-b border-border mb-1">
                    Plan {planLabel}
                  </p>
                )}
                {USER_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-muted hover:bg-background hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href={ADMIN_LINK.href}
                    className="block px-4 py-2 text-sm text-primary font-medium hover:bg-background"
                  >
                    {ADMIN_LINK.label}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-accent/20"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card/80">
        <div className="max-w-4xl mx-auto w-full px-3 md:px-6 flex gap-1 overflow-x-auto">
          {MODULE_LINKS.map((item) => {
            const active =
              item.href === "/dashboard/analisis"
                ? pathname.startsWith("/dashboard/analisis")
                : pathname.startsWith("/dashboard/generar");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {!membreteCompleto && <MembreteAlertBanner />}
          {children}
        </div>
      </main>
    </div>
  );
}

function ChevronIcon({
  open,
  className = "w-4 h-4",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${className}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
