"use client";

import { useQuery } from "@tanstack/react-query";
import { getDeliveries } from "@/lib/api";
import { SectionShell } from "@/components/section-shell";
import { WINDOW_SIZE } from "@/lib/paging";
import { isLiveDelivery } from "@/lib/delivery-status";

export default function DeliveriesLayout({ children }: { children: React.ReactNode }) {
  const deliveriesQuery = useQuery({
    queryKey: ["deliveries", WINDOW_SIZE, 0],
    queryFn: () => getDeliveries({ limit: WINDOW_SIZE, offset: 0 }),
    refetchInterval: 20_000,
  });

  const liveCount = (deliveriesQuery.data?.deliveries ?? []).filter((delivery) =>
    isLiveDelivery(delivery.status),
  ).length;

  return (
    <SectionShell
      title="Deliveries"
      description="Parcels moving right now, and everything that has already been dropped off."
      tabs={[
        { href: "/deliveries/live", label: "Live", badge: liveCount },
        { href: "/deliveries/history", label: "History" },
      ]}
    >
      {children}
    </SectionShell>
  );
}
