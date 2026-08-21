"use client";

import { useId, useState } from "react";

export type TableColumn = {
  key: string;
  label: string;
  /** Right-align and tabular-figure the cell. Numbers should set this. */
  numeric?: boolean;
};

type Props = {
  title: string;
  description?: string;
  /** Columns for the table view. Every chart must have one. */
  columns: TableColumn[];
  rows: Array<Record<string, string | number>>;
  /** True while a refetch is in flight and we already have something drawn. */
  isRefreshing?: boolean;
  isLoading?: boolean;
  error?: string | null;
  /** Shown in place of the chart when there is nothing to plot. */
  emptyLabel?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
};

/**
 * Card wrapper every chart sits in.
 *
 * Carries the two things a chart is not allowed to ship without: a table view
 * of the same numbers (so no value is reachable only by hovering, and so the
 * sub-3:1 fills have their required relief channel), and a refetch state that
 * dims the existing render rather than collapsing it into a skeleton — a
 * skeleton flash on a 20-second poll makes the whole page jump.
 */
export function ChartCard({
  title,
  description,
  columns,
  rows,
  isRefreshing,
  isLoading,
  error,
  emptyLabel = "No data for this range yet.",
  isEmpty,
  children,
}: Props) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((open) => !open)}
          aria-expanded={showTable}
          aria-controls={tableId}
          className="btn-outline text-xs"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {error ? <p className="alert-error mb-3">{error}</p> : null}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : isEmpty ? (
        <p className="py-10 text-center text-sm text-[var(--text-secondary)]">{emptyLabel}</p>
      ) : showTable ? (
        <div id={tableId} className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-brand-tint text-left text-[var(--text-secondary)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 py-2 font-semibold ${column.numeric ? "text-right" : ""}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-border">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-3 py-2 ${
                        column.numeric ? "text-right tabular-nums" : ""
                      }`}
                    >
                      {row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={`transition-opacity ${isRefreshing ? "opacity-60" : "opacity-100"}`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
