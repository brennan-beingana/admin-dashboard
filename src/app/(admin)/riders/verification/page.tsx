"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRiders, unwrapError, verifyRider } from "@/lib/api";
import { RiderVerificationCard } from "@/components/rider-verification-card";
import { StatusPill } from "@/components/status-pill";
import { WINDOW_SIZE } from "@/lib/paging";

export default function RiderVerificationPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const ridersQuery = useQuery({
    queryKey: ["riders", WINDOW_SIZE, 0],
    queryFn: () => getRiders({ limit: WINDOW_SIZE, offset: 0 }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      riderId,
      status,
      note,
    }: {
      riderId: string;
      status: "verified" | "rejected";
      note: string;
    }) => verifyRider(riderId, { status, note: note || undefined }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  const riders = useMemo(() => ridersQuery.data?.riders ?? [], [ridersQuery.data]);

  const pending = useMemo(
    () => riders.filter((rider) => rider.verification_status === "pending"),
    [riders],
  );

  // Recently decided riders, newest first — a short audit trail so an admin can
  // confirm the decision landed without hunting through the full directory.
  const decided = useMemo(
    () =>
      riders
        .filter((rider) => rider.verification_status !== "pending")
        .sort((a, b) => (b.verified_at ?? "").localeCompare(a.verified_at ?? ""))
        .slice(0, 10),
    [riders],
  );

  return (
    <div className="space-y-6">
      {ridersQuery.error || actionError ? (
        <p className="alert-error">{actionError ?? unwrapError(ridersQuery.error)}</p>
      ) : null}

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Awaiting verification</h2>
          <span className="text-xs text-[var(--text-secondary)]">
            {pending.length} in queue
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review each rider&apos;s KYC submission and approve or reject them. Riders can sign in
          but stay gated on a &ldquo;pending verification&rdquo; screen until approved.
        </p>

        {ridersQuery.isLoading ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading queue...</p>
        ) : pending.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {pending.map((rider) => (
              <RiderVerificationCard
                key={rider.id}
                rider={rider}
                isPending={verifyMutation.isPending}
                onVerify={(riderId, status, note) =>
                  verifyMutation.mutate({ riderId, status, note })
                }
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[12px] border border-border bg-brand-tint-soft p-3 text-sm text-[var(--text-secondary)]">
            Nothing to review — every rider has been verified or rejected.
          </p>
        )}
      </section>

      {decided.length ? (
        <section className="card p-5">
          <h2 className="text-lg font-semibold">Recent decisions</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {decided.map((rider) => (
              <li key={rider.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="font-medium">{rider.name}</span>
                <StatusPill status={rider.verification_status} />
                {rider.verified_at ? (
                  <span className="text-xs text-[var(--text-secondary)]">
                    {new Date(rider.verified_at).toLocaleString()}
                  </span>
                ) : null}
                {rider.verification_note ? (
                  <span className="text-xs text-[var(--text-secondary)]">
                    &ldquo;{rider.verification_note}&rdquo;
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
