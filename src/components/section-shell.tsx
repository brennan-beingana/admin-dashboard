"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SectionTab = {
  href: string;
  label: string;
  /** Optional count shown beside the label, e.g. items awaiting action. */
  badge?: number;
};

type Props = {
  title: string;
  description?: string;
  tabs: SectionTab[];
  /** Section-level action, rendered at the right of the header. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Header + sub-navigation wrapper shared by every admin section. Lives in the
 * section's `layout.tsx` so it keeps its state (and its queries) while the user
 * moves between tabs.
 */
export function SectionShell({ title, description, tabs, action, children }: Props) {
  const pathname = usePathname();

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description ? (
              <p className="text-sm text-[var(--text-secondary)]">{description}</p>
            ) : null}
          </div>
          {action}
        </div>

        <nav className="flex flex-wrap items-center gap-1 border-b border-border">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-brand text-brand-dark"
                    : "border-transparent text-[var(--text-secondary)] hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="pill" style={{ background: "#fef3d9", color: "#9a6a00" }}>
                    {tab.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>

      {children}
    </section>
  );
}
