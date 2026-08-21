"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDeliveries, unwrapError } from "@/lib/api";
import { DeliveriesTable } from "@/components/deliveries-table";
import { TableToolbar } from "@/components/table-toolbar";
import { matchesSearch } from "@/lib/table-filter";
import { WINDOW_SIZE } from "@/lib/paging";
import { LIVE_DELIVERY_STATUSES, isLiveDelivery } from "@/lib/delivery-status";

export default function LiveDeliveriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  // Tiles keep counting every in-flight parcel; only the table narrows.
  const visible = useMemo(
    () =>
      live.filter((delivery) => {
        if (
          statusFilter !== "all" &&
          (delivery.status ?? "").toLowerCase() !== statusFilter
        ) {
          return false;
        }
        return matchesSearch(
          delivery,
          [
            (d) => d.pickup_address,
            (d) => d.dropoff_address,
            (d) => d.recipient_name,
            (d) => d.recipient_phone,
            (d) => d.courier_name,
            (d) => d.status,
          ],
          search,
        );
      }),
    [live, statusFilter, search],
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

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search address, recipient, or courier"
        filters={[
          {
            id: "deliveries-live-status",
            label: "Live status",
            value: statusFilter,
            options: [
              { value: "all", label: "All live statuses" },
              ...LIVE_DELIVERY_STATUSES.map((status) => ({
                value: status,
                label: status.replace("_", " "),
              })),
            ],
            onChange: setStatusFilter,
          },
        ]}
        summary={
          <>
            {visible.length} of {live.length} parcels in flight
            {unassigned ? ` · ${unassigned} waiting for a courier` : ""}
          </>
        }
        actions={
          <span className="text-xs text-[var(--text-tertiary)]">Refreshed every 20s</span>
        }
      />

      {deliveriesQuery.error ? (
        <p className="alert-error">{unwrapError(deliveriesQuery.error)}</p>
      ) : null}

      <DeliveriesTable
        deliveries={visible}
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
