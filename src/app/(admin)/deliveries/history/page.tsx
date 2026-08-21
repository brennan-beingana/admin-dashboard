"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDeliveries, unwrapError } from "@/lib/api";
import { DeliveriesTable } from "@/components/deliveries-table";
import { TableToolbar } from "@/components/table-toolbar";
import { matchesSearch } from "@/lib/table-filter";
import { PAGE_SIZE } from "@/lib/paging";
import { isLiveDelivery } from "@/lib/delivery-status";

const FILTERS = ["closed", "delivered", "cancelled", "all"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  closed: "Delivered & cancelled",
  delivered: "Delivered only",
  cancelled: "Cancelled only",
  all: "Every status",
};

export default function DeliveryHistoryPage() {
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>("closed");
  const [search, setSearch] = useState("");

  // History is unbounded, so this tab pages against the API rather than
  // scanning a fixed window like the Live tab does.
  const deliveriesQuery = useQuery({
    queryKey: ["deliveries", PAGE_SIZE, offset],
    queryFn: () => getDeliveries({ limit: PAGE_SIZE, offset }),
  });

  const deliveries = useMemo(
    () => deliveriesQuery.data?.deliveries ?? [],
    [deliveriesQuery.data],
  );

  const visible = useMemo(
    () =>
      deliveries.filter((delivery) => {
        const status = delivery.status?.toLowerCase() ?? "";
        const passesStatus = (() => {
          switch (filter) {
            case "closed":
              return !isLiveDelivery(status);
            case "delivered":
              return status === "delivered";
            case "cancelled":
              return status === "cancelled" || status === "canceled";
            case "all":
              return true;
          }
        })();
        if (!passesStatus) return false;
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
    [deliveries, filter, search],
  );

  const pageRevenue = useMemo(
    () =>
      visible
        .filter((delivery) => delivery.status?.toLowerCase() === "delivered")
        .reduce((total, delivery) => total + (Number(delivery.price) || 0), 0),
    [visible],
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search address, recipient, or courier"
        filters={[
          {
            id: "deliveries-history-status",
            label: "Delivery status",
            value: filter,
            options: FILTERS.map((value) => ({ value, label: FILTER_LABELS[value] })),
            onChange: (value) => setFilter(value as Filter),
          },
        ]}
        summary={`${visible.length} of ${deliveries.length} deliveries on this page`}
        actions={
          <span className="text-xs text-[var(--text-secondary)]">
            Delivered revenue on this page:{" "}
            <span className="font-semibold text-foreground">{pageRevenue.toFixed(2)}</span>
          </span>
        }
      />

      {deliveriesQuery.error ? (
        <p className="alert-error">{unwrapError(deliveriesQuery.error)}</p>
      ) : null}

      <DeliveriesTable
        deliveries={visible}
        isLoading={deliveriesQuery.isLoading}
        emptyLabel="No deliveries on this page match the filter."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          disabled={offset === 0}
          className="btn-outline text-sm"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={deliveries.length < PAGE_SIZE}
          className="btn-outline text-sm"
        >
          Next
        </button>
        <span className="text-xs text-[var(--text-tertiary)]">
          The API has no status filter yet, so the dropdown narrows the loaded page only.
        </span>
      </div>
    </div>
  );
}
