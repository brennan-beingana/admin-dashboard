"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUser, getUsers, unwrapError } from "@/lib/api";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { SERIES } from "@/components/charts/chart-theme";
import { TableToolbar } from "@/components/table-toolbar";
import { toGrowthSeries } from "@/lib/analytics";
import { PAGE_SIZE, WINDOW_SIZE } from "@/lib/paging";
import {
  matchesSearch,
  RECENCY_FILTERS,
  RECENCY_LABELS,
  withinRecency,
  type RecencyFilter,
} from "@/lib/table-filter";

const RECENCY_OPTIONS = RECENCY_FILTERS.map((value) => ({
  value,
  label: RECENCY_LABELS[value],
}));

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [joined, setJoined] = useState<RecencyFilter>("all");
  const queryClient = useQueryClient();

  // Pulls one window rather than paging the API: searching and the growth
  // curve both need the whole set, and the API cannot filter server-side yet.
  const usersQuery = useQuery({
    queryKey: ["users", WINDOW_SIZE, 0],
    queryFn: () => getUsers({ limit: WINDOW_SIZE, offset: 0 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (!withinRecency(user.created_at, joined)) return false;
        return matchesSearch(
          user,
          [(u) => u.name, (u) => u.phone, (u) => u.email],
          search,
        );
      }),
    [users, search, joined],
  );

  // Narrowing can leave the current page past the end.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Growth is drawn from every loaded user, not the filtered slice — a search
  // term should narrow the table, not silently rewrite the trend.
  const growth = useMemo(() => toGrowthSeries(users.map((user) => user.created_at)), [users]);
  const windowed = users.length >= WINDOW_SIZE;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-[var(--text-secondary)]">Passenger user accounts.</p>
      </header>

      <ChartCard
        title="User growth"
        description={
          windowed
            ? `Cumulative sign-ups across the ${WINDOW_SIZE} users loaded — the API has no growth endpoint, so earlier accounts are not counted.`
            : "Cumulative sign-ups, counted from every account's join date."
        }
        columns={[
          { key: "label", label: "Day" },
          { key: "added", label: "Signed up", numeric: true },
          { key: "cumulative", label: "Total", numeric: true },
        ]}
        rows={growth.map((point) => ({
          label: point.label,
          added: point.added,
          cumulative: point.cumulative,
        }))}
        isLoading={usersQuery.isLoading}
        isRefreshing={usersQuery.isFetching && !usersQuery.isLoading}
        error={usersQuery.error ? unwrapError(usersQuery.error) : null}
        isEmpty={!growth.length}
        emptyLabel="No sign-up dates to plot."
      >
        <TrendChart
          data={growth.map((point) => ({ label: point.label, cumulative: point.cumulative }))}
          xKey="label"
          series={[{ key: "cumulative", label: "Total users", color: SERIES.one, fill: true }]}
        />
      </ChartCard>

      <TableToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder="Search name, phone, or email"
        filters={[
          {
            id: "users-joined",
            label: "Joined",
            value: joined,
            options: RECENCY_OPTIONS,
            onChange: (value) => {
              setJoined(value as RecencyFilter);
              setPage(0);
            },
          },
        ]}
        summary={`${filtered.length} of ${users.length} users`}
      />

      {usersQuery.error ? <p className="alert-error">{unwrapError(usersQuery.error)}</p> : null}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-tint text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.phone}</td>
                <td className="px-4 py-3">{user.email ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {new Date(user.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(user.id)}
                    className="btn-danger text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!visible.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--text-secondary)]" colSpan={5}>
                  {usersQuery.isLoading ? "Loading users..." : "No users match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          disabled={safePage === 0}
          className="btn-outline text-sm"
        >
          Previous
        </button>
        <span className="text-xs text-[var(--text-secondary)]">
          Page {safePage + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          disabled={safePage >= pageCount - 1}
          className="btn-outline text-sm"
        >
          Next
        </button>
        {windowed ? (
          <span className="text-xs text-[var(--text-tertiary)]">
            Showing the first {WINDOW_SIZE} users — server-side search is not available yet.
          </span>
        ) : null}
      </div>
    </section>
  );
}
