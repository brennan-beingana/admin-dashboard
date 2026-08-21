/**
 * Chart colour and chrome tokens.
 *
 * Data marks come from a palette validated against *this* dashboard's card
 * surface (#ffffff), not the reference default surface:
 *
 *   categorical slots 1–2  #2a78d6, #eb6834   all six checks PASS
 *                                             (worst adjacent CVD ΔE 24.7)
 *   ordinal lifecycle ramp #86b6ef → #1c5cab  monotone L, light end 2.11:1
 *   status good     #0ca30c  3.35:1
 *   status critical #d03b3b  4.80:1
 *   status muted    #898781  3.59:1
 *   status warning  #fab219  1.83:1  — sub-3:1 by design
 *
 * Warning is the one colour under 3:1, so every chart that uses it ships direct
 * labels and a table view. That is the relief rule, not an oversight.
 *
 * Brand green is deliberately not a series colour. It is the UI accent, and at
 * #7ac143 it measures 2.1:1 on white — too weak for a mark, and spending the
 * identity channel on brand is what the palette rules exist to prevent. Chrome
 * instead follows the dashboard's own tokens so charts sit inside the existing
 * cards without looking imported.
 */

/** Categorical slots. Assigned in fixed order and never cycled. */
export const SERIES = {
  one: "#2a78d6",
  two: "#eb6834",
} as const;

/**
 * Ride lifecycle. Ordered, so it takes a one-hue ramp light→dark rather than
 * unrelated hues: the reader sees "further along" in the colour. Cancelled is
 * not a stage on that path — it is the off-ramp — so it carries the reserved
 * critical red instead.
 */
export const RIDE_STATUS_COLORS: Record<string, string> = {
  pending: "#86b6ef",
  accepted: "#5598e7",
  in_progress: "#2a78d6",
  completed: "#1c5cab",
  cancelled: "#d03b3b",
};

/** Rider activity is genuine state, so it takes the reserved status palette. */
export const RIDER_ACTIVITY_COLORS: Record<string, string> = {
  available: "#0ca30c",
  busy: "#fab219",
  offline: "#898781",
};

/** Fallback for a status string the backend adds that we have not mapped. */
export const UNMAPPED_SLICE = "#898781";

/**
 * Chrome. Hairline, solid, recessive — never dashed, which reads as
 * "projection" when it is only a grid.
 */
export const CHROME = {
  grid: "#e6e8e1",
  axisLine: "#e6e8e1",
  axisText: "#9ca3af",
  surface: "#ffffff",
} as const;

export const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #e6e8e1",
  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  fontSize: 12,
} as const;
