"use client";

export type FilterOption = { value: string; label: string };

export type FilterSpec = {
  id: string;
  /** Accessible name for the select — the visible chrome is the options. */
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: FilterSpec[];
  /** e.g. "12 of 40 riders" — the count after narrowing. */
  summary?: React.ReactNode;
  /** Right-aligned extras: a create button, a revenue total. */
  actions?: React.ReactNode;
};

/**
 * One filter row above the table it scopes.
 *
 * Shared rather than repeated per page so every table narrows the same way and
 * the controls cannot drift apart in wording or layout.
 */
export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  summary,
  actions,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="table-search">
        {searchPlaceholder}
      </label>
      <input
        id="table-search"
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="field w-full sm:w-72"
      />

      {filters.map((filter) => (
        <span key={filter.id}>
          <label className="sr-only" htmlFor={filter.id}>
            {filter.label}
          </label>
          <select
            id={filter.id}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className="field"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
      ))}

      {summary ? (
        <span className="text-xs text-[var(--text-secondary)]">{summary}</span>
      ) : null}

      {actions ? <span className="ml-auto flex items-center gap-3">{actions}</span> : null}
    </div>
  );
}
