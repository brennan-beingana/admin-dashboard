"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/storage";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/riders", label: "Riders" },
  { href: "/users", label: "Users" },
  { href: "/rides", label: "Rides" },
  { href: "/charging-stations", label: "Charging Stations" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearAdminToken();
    router.replace("/login");
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-8">
        <BrandLogo subtitle="Operations dashboard" />
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          // Sections have sub-routes (/riders/list, /rides/live, ...), so the
          // top-level link stays active for anything beneath it.
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-[12px] px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand text-white"
                  : "text-foreground hover:bg-brand-tint-soft"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button type="button" onClick={logout} className="btn-outline mt-auto w-full text-sm">
        Sign out
      </button>
    </aside>
  );
}
