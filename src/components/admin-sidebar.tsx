"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/storage";

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
    <aside className="w-64 shrink-0 border-r border-black/10 bg-background p-4">
      <div className="mb-8">
        <h1 className="text-lg font-semibold">E-Bike Admin</h1>
        <p className="text-xs text-foreground/70">Operations dashboard</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                active ? "bg-foreground text-background" : "hover:bg-black/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-8 w-full rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5"
      >
        Sign out
      </button>
    </aside>
  );
}
