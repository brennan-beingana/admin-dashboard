import type { CSSProperties } from "react";

type Tone = "brand" | "warning" | "danger" | "neutral" | "info";

const toneStyles: Record<Tone, CSSProperties> = {
  brand: { background: "var(--brand-tint)", color: "var(--brand-dark)" },
  warning: { background: "#fef3d9", color: "#9a6a00" },
  danger: { background: "#fdecec", color: "#a5231f" },
  info: { background: "#e5eefb", color: "#1e4fa3" },
  neutral: { background: "#eceee9", color: "var(--text-secondary)" },
};

// Map backend ride/rider status strings onto a semantic tone, mirroring the
// mobile apps' online=green / cancelled=red conventions.
function toneForStatus(status: string): Tone {
  switch (status.toLowerCase()) {
    case "online":
    case "completed":
    case "active":
    case "verified":
    case "delivered":
      return "brand";
    case "pending":
    case "pending_verification":
    case "accepted":
      return "warning";
    case "rejected":
      return "danger";
    case "in_progress":
    case "in progress":
    case "picked_up":
    case "in_transit":
      return "info";
    case "cancelled":
    case "canceled":
    case "offline":
      return status.toLowerCase() === "offline" ? "neutral" : "danger";
    default:
      return "neutral";
  }
}

function prettyLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusPill({ status }: { status?: string | null }) {
  if (!status) return <span className="text-[var(--text-tertiary)]">—</span>;

  const tone = toneForStatus(status);
  const showDot = ["online", "offline"].includes(status.toLowerCase());

  return (
    <span className="pill" style={toneStyles[tone]}>
      {showDot ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background:
              status.toLowerCase() === "online" ? "var(--brand)" : "var(--text-tertiary)",
          }}
        />
      ) : null}
      {prettyLabel(status)}
    </span>
  );
}
