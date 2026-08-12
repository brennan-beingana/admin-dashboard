"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDeliveries, unwrapError } from "@/lib/api";
import { DeliveriesTable } from "@/components/deliveries-table";
import { WINDOW_SIZE } from "@/lib/paging";
import { LIVE_DELIVERY_STATUSES, isLiveDelivery } from "@/lib/delivery-status";

export default function LiveDeliveriesPage() {
  const deliveriesQuery = useQuery({
    queryKey: ["deliveries", WINDOW_SIZE, 0],
    queryFn: () => getDeliveries({ limit: WINDOW_SIZE, offset: 0 }),
    refetchInterval: 20_000,
  });

  const deliveries = useMemo(
    () => deliveriesQuery.data?.deliveries ?? [],
    [deliveriesQuery.data],
  );

  const live = useMemo(
    () =>
      deliveries
        .filter((delivery) => isLiveDelivery(delivery.status))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [deliveries],
  );

  const byStatus = useMemo(
    () =>
      LIVE_DELIVERY_STATUSES.map((status) => ({
        status,
        count: live.filter((delivery) => delivery.status?.toLowerCase() === status).length,
      })),
    [live],
  );

  const unassigned = useMemo(
    () => live.filter((delivery) => !delivery.courier_id).length,
    [live],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {byStatus.map(({ status, count }) => (
          <div key={status} className="card p-4">
            <p className="text-xs capitalize text-[var(--text-secondary)]">
              {status.replace("_", " ")}
            </p>
            <p className="text-2xl font-semibold">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-[var(--text-secondary)]">
          {live.length} parcels in flight
        </span>
        {unassigned ? (
          <span className="text-xs text-[var(--text-secondary)]">
            · {unassigned} waiting for a courier
          </span>
        ) : null}
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          Refreshed every 20s
        </span>
      </div>

      {deliveriesQuery.error ? (
        <p className="alert-error">{unwrapError(deliveriesQuery.error)}</p>
      ) : null}

      <DeliveriesTable
        deliveries={live}
        isLoading={deliveriesQuery.isLoading}
        emptyLabel="No parcels are pending, accepted, or in transit right now."
      />

      {deliveries.length >= WINDOW_SIZE ? (
        <p className="text-xs text-[var(--text-tertiary)]">
          Scanned the {WINDOW_SIZE} most recent deliveries — the API cannot filter by status yet,
          so older in-flight parcels would not appear here.
        </p>
      ) : null}
    </div>
  );
}
