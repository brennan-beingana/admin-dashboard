"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRides, unwrapError } from "@/lib/api";
import { RidesTable } from "@/components/rides-table";
import { TableToolbar } from "@/components/table-toolbar";
import { matchesSearch } from "@/lib/table-filter";
import { PAGE_SIZE } from "@/lib/paging";
import { isLiveRide } from "@/lib/ride-status";

const FILTERS = ["closed", "completed", "cancelled", "all"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  closed: "Completed & cancelled",
  completed: "Completed only",
  cancelled: "Cancelled only",
  all: "Every status",
};

export default function RideHistoryPage() {
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>("closed");
  const [search, setSearch] = useState("");

  // History is unbounded, so this tab pages against the API rather than
  // scanning a fixed window like the Live tab does.
  const ridesQuery = useQuery({
    queryKey: ["rides", PAGE_SIZE, offset],
    queryFn: () => getRides({ limit: PAGE_SIZE, offset }),
  });

  const rides = useMemo(() => ridesQuery.data?.rides ?? [], [ridesQuery.data]);

  const visible = useMemo(
    () =>
      rides.filter((ride) => {
        const status = ride.status?.toLowerCase() ?? "";
        const passesStatus = (() => {
          switch (filter) {
            case "closed":
              return !isLiveRide(status);
            case "completed":
              return status === "completed";
            case "cancelled":
              return status === "cancelled" || status === "canceled";
            case "all":
              return true;
          }
        })();
        if (!passesStatus) return false;
        return matchesSearch(
          ride,
          [(r) => r.origin_name, (r) => r.destination_name, (r) => r.status, (r) => r.id],
          search,
        );
      }),
    [rides, filter, search],
  );

  const pageRevenue = useMemo(
    () =>
      visible
        .filter((ride) => ride.status?.toLowerCase() === "completed")
        .reduce((total, ride) => total + (Number(ride.price) || 0), 0),
    [visible],
  );

  return (
    <div className="space-y-4">
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search origin, destination, or status"
        filters={[
          {
            id: "rides-history-status",
            label: "Ride status",
            value: filter,
            options: FILTERS.map((value) => ({ value, label: FILTER_LABELS[value] })),
            onChange: (value) => setFilter(value as Filter),
          },
        ]}
        summary={`${visible.length} of ${rides.length} rides on this page`}
        actions={
          <span className="text-xs text-[var(--text-secondary)]">
            Completed revenue on this page:{" "}
            <span className="font-semibold text-foreground">{pageRevenue.toFixed(2)}</span>
          </span>
        }
      />

      {ridesQuery.error ? <p className="alert-error">{unwrapError(ridesQuery.error)}</p> : null}

      <RidesTable
        rides={visible}
        isLoading={ridesQuery.isLoading}
        emptyLabel="No rides on this page match the filter."
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
          disabled={rides.length < PAGE_SIZE}
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
