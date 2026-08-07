"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiders } from "@/lib/api";
import { SectionShell } from "@/components/section-shell";
import { WINDOW_SIZE } from "@/lib/paging";

export default function RidersLayout({ children }: { children: React.ReactNode }) {
  // Shared by every rider tab: one cached window keyed identically to the tab
  // pages, so switching tabs never refetches.
  const ridersQuery = useQuery({
    queryKey: ["riders", WINDOW_SIZE, 0],
    queryFn: () => getRiders({ limit: WINDOW_SIZE, offset: 0 }),
  });

  const pendingCount = (ridersQuery.data?.riders ?? []).filter(
    (rider) => rider.verification_status === "pending",
  ).length;

  return (
    <SectionShell
      title="Riders"
      description="Verification queue, rider directory, and last-known positions."
      tabs={[
        { href: "/riders/verification", label: "Verification", badge: pendingCount },
        { href: "/riders/list", label: "Rider List" },
        { href: "/riders/map", label: "Map" },
      ]}
    >
      {children}
    </SectionShell>
  );
}
