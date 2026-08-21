"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRides, unwrapError } from "@/lib/api";
import { RidesTable } from "@/components/rides-table";
import { TableToolbar } from "@/components/table-toolbar";
import { matchesSearch } from "@/lib/table-filter";
import { WINDOW_SIZE } from "@/lib/paging";
import { LIVE_RIDE_STATUSES, isLiveRide } from "@/lib/ride-status";

export default function LiveRidesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const ridesQuery = useQuery({
    queryKey: ["rides", WINDOW_SIZE, 0],
    queryFn: () => getRides({ limit: WINDOW_SIZE, offset: 0 }),
    refetchInterval: 20_000,
  });

  const rides = useMemo(() => ridesQuery.data?.rides ?? [], [ridesQuery.data]);

  const live = useMemo(
    () =>
      rides
        .filter((ride) => isLiveRide(ride.status))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rides],
  );

  // The status tiles above always count every in-flight ride; only the table
  // narrows, so the filter cannot make the headline numbers disagree with it.
  const visible = useMemo(
    () =>
      live.filter((ride) => {
        if (statusFilter !== "all" && (ride.status ?? "").toLowerCase() !== statusFilter) {
          return false;
        }
        return matchesSearch(
          ride,
          [(r) => r.origin_name, (r) => r.destination_name, (r) => r.status, (r) => r.id],
          search,
        );
      }),
    [live, statusFilter, search],
  );

  const byStatus = useMemo(
    () =>
      LIVE_RIDE_STATUSES.map((status) => ({
        status,
        count: live.filter((ride) => ride.status?.toLowerCase() === status).length,
      })),
    [live],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
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
        searchPlaceholder="Search origin, destination, or status"
        filters={[
          {
            id: "rides-live-status",
            label: "Live status",
            value: statusFilter,
            options: [
              { value: "all", label: "All live statuses" },
              ...LIVE_RIDE_STATUSES.map((status) => ({
                value: status,
                label: status.replace("_", " "),
              })),
            ],
            onChange: setStatusFilter,
          },
        ]}
        summary={`${visible.length} of ${live.length} rides in flight`}
        actions={
          <span className="text-xs text-[var(--text-tertiary)]">Refreshed every 20s</span>
        }
      />

      {ridesQuery.error ? <p className="alert-error">{unwrapError(ridesQuery.error)}</p> : null}

      <RidesTable
        rides={visible}
        isLoading={ridesQuery.isLoading}
        emptyLabel="No rides are pending, accepted, or in progress right now."
      />

      {rides.length >= WINDOW_SIZE ? (
        <p className="text-xs text-[var(--text-tertiary)]">
          Scanned the {WINDOW_SIZE} most recent rides — the API cannot filter by status yet, so
          older in-flight rides would not appear here.
        </p>
      ) : null}
    </div>
  );
}
