"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHROME, TOOLTIP_STYLE } from "./chart-theme";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: DonutSlice[];
  /** Rendered in the hole. Usually the total the slices add up to. */
  centerValue: string | number;
  centerLabel: string;
  height?: number;
};

/**
 * Part-to-whole at a glance. Capped at six slices by the caller — past that,
 * adjacent segments blur and a table reads better.
 *
 * Every slice is labelled in the legend with its count and share, so identity
 * never rests on colour alone. That is also what licenses the sub-3:1 warning
 * fill in the rider-activity palette.
 */
export function DonutChart({ slices, centerValue, centerLabel, height = 260 }: Props) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div style={{ height, width: height }} className="relative shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              // A 2px ring in the surface colour separates neighbours; a
              // contrasting border drawn around each slice would be heavier and
              // is the thing this replaces.
              stroke={CHROME.surface}
              strokeWidth={2}
              paddingAngle={slices.length > 1 ? 1 : 0}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [
                `${value} (${share(Number(value)).toFixed(1)}%)`,
                String(name ?? ""),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{centerValue}</span>
          <span className="text-xs text-[var(--text-secondary)]">{centerLabel}</span>
        </div>
      </div>

      <ul className="min-w-[12rem] flex-1 space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: slice.color }}
            />
            {/* Label and value wear text tokens, not the series colour. */}
            <span className="flex-1 text-[var(--text-secondary)]">{slice.label}</span>
            <span className="font-medium tabular-nums">{slice.value}</span>
            <span className="w-14 text-right tabular-nums text-[var(--text-secondary)]">
              {share(slice.value).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
