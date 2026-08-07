"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRides, unwrapError } from "@/lib/api";
import { RidesTable } from "@/components/rides-table";
import { WINDOW_SIZE } from "@/lib/paging";
import { LIVE_RIDE_STATUSES, isLiveRide } from "@/lib/ride-status";

export default function LiveRidesPage() {
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

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-[var(--text-secondary)]">
          {live.length} rides in flight
        </span>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          Refreshed every 20s
        </span>
      </div>

      {ridesQuery.error ? <p className="alert-error">{unwrapError(ridesQuery.error)}</p> : null}

      <RidesTable
        rides={live}
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
