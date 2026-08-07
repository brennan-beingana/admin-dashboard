"use client";

import { useQuery } from "@tanstack/react-query";
import { getRides } from "@/lib/api";
import { SectionShell } from "@/components/section-shell";
import { WINDOW_SIZE } from "@/lib/paging";
import { isLiveRide } from "@/lib/ride-status";

export default function RidesLayout({ children }: { children: React.ReactNode }) {
  const ridesQuery = useQuery({
    queryKey: ["rides", WINDOW_SIZE, 0],
    queryFn: () => getRides({ limit: WINDOW_SIZE, offset: 0 }),
    refetchInterval: 20_000,
  });

  const liveCount = (ridesQuery.data?.rides ?? []).filter((ride) =>
    isLiveRide(ride.status),
  ).length;

  return (
    <SectionShell
      title="Rides"
      description="Trips in flight right now, and everything that has already finished."
      tabs={[
        { href: "/rides/live", label: "Live", badge: liveCount },
        { href: "/rides/history", label: "History" },
      ]}
    >
      {children}
    </SectionShell>
  );
}
