"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Home", exact: true },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = userEmail.slice(0, 2).toUpperCase();
  const isAccountActive = pathname.startsWith("/dashboard/cuenta");

  function isNavActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

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
        <div className="px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="font-bold text-primary text-lg shrink-0"
          >
            Vigia Judicial
          </Link>

          {/* Nav horizontal — desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-primary text-white"
                      : "text-muted hover:text-primary hover:bg-background"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Menu usuario */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] ${
                menuOpen
                  ? "border-primary bg-primary text-white shadow-lg"
                  : "border-primary bg-primary/10 text-primary shadow-md ring-2 ring-primary/20"
              }`}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            >
              <span
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                  menuOpen ? "bg-white/20 text-white" : "bg-primary text-white"
                }`}
              >
                {initials}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs opacity-80">Menu</span>
                <span className="text-sm">{menuOpen ? "Cerrar" : "Abrir"}</span>
              </span>
              <ChevronIcon open={menuOpen} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-2 z-40">
                <p className="px-4 py-2 text-xs text-muted truncate border-b border-border mb-1">
                  {userEmail}
                </p>

                {/* Nav movil dentro del dropdown */}
                <div className="md:hidden px-2 pb-2 mb-2 border-b border-border space-y-1">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2 rounded-lg text-sm ${
                        isNavActive(item)
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-background"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {USER_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 text-sm hover:bg-background ${
                      isAccountActive ? "text-primary font-medium" : "text-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                >
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
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
