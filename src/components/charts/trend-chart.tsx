"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHROME, TOOLTIP_STYLE } from "./chart-theme";

export type TrendSeries = {
  key: string;
  label: string;
  color: string;
  /** Draw a 10% wash under the line. Use for a single headline series only. */
  fill?: boolean;
};

type Props = {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: TrendSeries[];
  /** Formats the y tick and the tooltip value, e.g. a percentage. */
  valueFormatter?: (value: number) => string;
  /** Fixes the y domain — needed for rates, where 0–100 is the real scale. */
  yDomain?: [number, number];
  height?: number;
};

/**
 * Line chart for change over time. One y-axis only: two measures of different
 * scale get two charts, never a second axis.
 *
 * A legend appears from two series up; a single series is named by the card
 * title instead, so there is no legend box stating the obvious.
 */
export function TrendChart({
  data,
  xKey,
  series,
  valueFormatter,
  yDomain,
  height = 260,
}: Props) {
  const showLegend = series.length > 1;

  return (
    // Height includes the x-axis band, so the card never grows an inner scroll.
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {series
              .filter((entry) => entry.fill)
              .map((entry) => (
                <linearGradient
                  key={entry.key}
                  id={`wash-${entry.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
          </defs>

          {/* Solid hairline grid — dashing reads as a threshold it does not mean. */}
          <CartesianGrid stroke={CHROME.grid} vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke={CHROME.axisLine}
            tick={{ fill: CHROME.axisText, fontSize: 11 }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            stroke={CHROME.axisLine}
            tick={{ fill: CHROME.axisText, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={yDomain}
            tickFormatter={valueFormatter}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [
              valueFormatter ? valueFormatter(Number(value)) : String(value ?? ""),
              String(name ?? ""),
            ]}
          />
          {showLegend ? (
            <Legend
              verticalAlign="top"
              align="left"
              height={28}
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            />
          ) : null}

          {series.map((entry) => (
            <Area
              key={entry.key}
              type="monotone"
              dataKey={entry.key}
              name={entry.label}
              stroke={entry.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={entry.fill ? `url(#wash-${entry.key})` : "transparent"}
              // A dot per point is noise on a dense series; the hover dot is
              // sized past the 8px minimum so it is easy to land on.
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: CHROME.surface }}
            />
          ))}
          {/* Line is declared via Area above; this keeps recharts' types happy
              when a caller passes zero series. */}
          {series.length === 0 ? <Line dataKey="__none__" /> : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
