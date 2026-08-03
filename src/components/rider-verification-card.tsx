"use client";

import { useState } from "react";
import type { Rider } from "@/lib/types";
import { StatusPill } from "@/components/status-pill";

type DocLink = { label: string; url?: string };

function DocThumb({ label, url }: DocLink) {
  if (!url) {
    return (
      <div className="flex h-28 flex-col items-center justify-center rounded-[12px] border border-dashed border-border bg-brand-tint-soft text-center text-xs text-[var(--text-secondary)]">
        <span className="font-medium">{label}</span>
        <span>Not provided</span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[12px] border border-border"
      title={`Open ${label}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="h-28 w-full object-cover transition group-hover:opacity-90"
      />
      <span className="block bg-white px-2 py-1 text-center text-xs text-[var(--text-secondary)]">
        {label}
      </span>
    </a>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

type Props = {
  rider: Rider;
  onVerify: (riderId: string, status: "verified" | "rejected", note: string) => void;
  isPending: boolean;
};

export function RiderVerificationCard({ rider, onVerify, isPending }: Props) {
  const [note, setNote] = useState("");

  return (
    <div className="rounded-[16px] border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{rider.name}</p>
          <p className="text-sm text-[var(--text-secondary)]">{rider.phone}</p>
        </div>
        <StatusPill status={rider.verification_status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="NIN" value={rider.nin} />
        <Field label="Bike number plate" value={rider.vehicle_plate} />
        <Field label="Bike name" value={rider.bike_name} />
        <Field label="Bike model" value={rider.bike_model} />
        <Field label="Current residence" value={rider.current_residence} />
        <Field label="Email" value={rider.email} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DocThumb label="Profile photo" url={rider.photo_url} />
        <DocThumb label="National ID" url={rider.nin_photo_url} />
        <DocThumb label="Recommendation" url={rider.recommendation_letter_url} />
        <DocThumb label="License" url={rider.license_photo_url} />
      </div>

      {rider.verification_status === "pending" ? (
        <div className="mt-4 space-y-2">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note (optional — shown for rejections)"
            className="field w-full"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onVerify(rider.id, "verified", note)}
              className="btn-primary text-sm"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onVerify(rider.id, "rejected", note)}
              className="btn-danger text-sm"
            >
              Reject
            </button>
          </div>
        </div>
      ) : rider.verification_note ? (
        <p className="mt-3 rounded-[12px] border border-border bg-brand-tint-soft p-2 text-xs text-[var(--text-secondary)]">
          Note: {rider.verification_note}
        </p>
      ) : null}
    </div>
  );
}
