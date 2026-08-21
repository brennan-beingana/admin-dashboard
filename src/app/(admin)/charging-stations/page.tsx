"use client";

import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChargingStation,
  deleteChargingStation,
  getChargingStations,
  updateChargingStation,
  unwrapError,
} from "@/lib/api";
import type { MapMarker } from "@/components/location-map";
import { isValidLatLon } from "@/lib/geo";

// Google Maps needs the browser `window`, so load the map client-side only.
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-[16px] border border-border bg-brand-tint-soft text-sm text-[var(--text-secondary)]">
      Loading map...
    </div>
  ),
});

const PAGE_SIZE = 20;

type FormState = {
  name: string;
  lat: string;
  lon: string;
  capacity: string;
  meta: string;
};

const emptyForm: FormState = {
  name: "",
  lat: "",
  lon: "",
  capacity: "1",
  meta: "{}",
};

// Coordinates are usually copied out of Google Maps as one "lat, lng" string.
// Pasting that into the latitude box otherwise yields a value that fails the
// number check with no hint as to why, so split it across both fields instead.
function applyLatInput(prev: FormState, value: string): FormState {
  const pair = value.split(",");
  if (pair.length === 2) {
    const [lat, lon] = pair.map((part) => part.trim());
    if (lat && lon && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
      return { ...prev, lat, lon };
    }
  }
  return { ...prev, lat: value };
}

export default function ChargingStationsPage() {
  const [offset, setOffset] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const stationsQuery = useQuery({
    queryKey: ["charging-stations", PAGE_SIZE, offset],
    queryFn: () => getChargingStations({ limit: PAGE_SIZE, offset }),
  });

  const createMutation = useMutation({
    mutationFn: createChargingStation,
    onSuccess: async () => {
      setForm(emptyForm);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["charging-stations"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateChargingStation>[1] }) =>
      updateChargingStation(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      setForm(emptyForm);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["charging-stations"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChargingStation,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["charging-stations"] });
    },
    onError: (error) => {
      setActionError(unwrapError(error));
    },
  });

  const stations = stationsQuery.data?.charging_stations ?? [];

  const isMutating = useMemo(
    () => createMutation.isPending || updateMutation.isPending,
    [createMutation.isPending, updateMutation.isPending],
  );

  const stationMarkers = useMemo<MapMarker[]>(() => {
    return stations.flatMap((station) => {
      // The API sends numeric latitude/longitude, not a WKT string.
      if (!isValidLatLon(station.latitude, station.longitude)) return [];
      return [
        {
          id: station.id,
          lat: station.latitude,
          lon: station.longitude,
          title: station.name,
          subtitle: `Capacity ${station.capacity}`,
        },
      ];
    });
  }, [stations]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);

    let parsedMeta: Record<string, unknown> | undefined;

    if (form.meta.trim()) {
      try {
        parsedMeta = JSON.parse(form.meta) as Record<string, unknown>;
      } catch {
        setActionError("Meta must be valid JSON.");
        return;
      }
    }

    // Guard the blank box before Number() does: Number("") is 0, not NaN, so a
    // missing coordinate used to sail past a NaN check and move the station to
    // null island off the coast of Africa.
    if (!form.lat.trim() || !form.lon.trim()) {
      setActionError("Latitude and longitude are both required.");
      return;
    }

    const payload = {
      name: form.name,
      lat: Number(form.lat),
      lon: Number(form.lon),
      capacity: Number(form.capacity || 1),
      meta: parsedMeta,
    };

    if (Number.isNaN(payload.lat) || Number.isNaN(payload.lon)) {
      setActionError("Latitude and longitude must be numbers.");
      return;
    }

    if (!isValidLatLon(payload.lat, payload.lon)) {
      setActionError(
        "Latitude must be between -90 and 90 and longitude between -180 and 180.",
      );
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const startEdit = (station: (typeof stations)[number]) => {
    // Prefill from the numeric fields the API returns. This used to read a
    // non-existent `location` string and leave both boxes blank, which meant
    // editing anything else on a station silently rewrote its position — see
    // the empty-input guard in handleSubmit.
    setEditingId(station.id);
    setForm({
      name: station.name,
      lat: Number.isFinite(station.latitude) ? String(station.latitude) : "",
      lon: Number.isFinite(station.longitude) ? String(station.longitude) : "",
      capacity: String(station.capacity ?? 1),
      meta: JSON.stringify(station.meta ?? {}, null, 2),
    });
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Charging Stations</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Create, update, and remove charging stations.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card p-5">
        <h2 className="text-lg font-semibold">{editingId ? "Update Station" : "Create Station"}</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="field"
            placeholder="Station name"
          />
          <input
            required
            value={form.lat}
            onChange={(event) => setForm((prev) => applyLatInput(prev, event.target.value))}
            className="field"
            placeholder="Latitude (e.g. 0.347761)"
          />
          <input
            required
            value={form.lon}
            onChange={(event) => setForm((prev) => ({ ...prev, lon: event.target.value }))}
            className="field"
            placeholder="Longitude (e.g. 32.569030)"
          />
          <input
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            className="field"
            placeholder="Capacity"
          />
          <textarea
            value={form.meta}
            onChange={(event) => setForm((prev) => ({ ...prev, meta: event.target.value }))}
            className="field min-h-28 md:col-span-2"
            placeholder='Meta JSON e.g. { "operator": "EV Uganda" }'
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button type="submit" disabled={isMutating} className="btn-primary">
            {editingId ? (isMutating ? "Updating..." : "Update") : isMutating ? "Creating..." : "Create"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="btn-outline"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Station Map</h2>
          <span className="text-xs text-[var(--text-secondary)]">
            {stationMarkers.length} of {stations.length} mapped
          </span>
        </div>
        <div className="mt-4">
          <LocationMap
            markers={stationMarkers}
            emptyLabel="No charging stations on this page have a valid location."
          />
        </div>
      </section>

      {stationsQuery.error || actionError ? (
        <p className="alert-error">{actionError ?? unwrapError(stationsQuery.error)}</p>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-tint text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Capacity</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr key={station.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{station.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {isValidLatLon(station.latitude, station.longitude)
                    ? `${station.latitude.toFixed(6)}, ${station.longitude.toFixed(6)}`
                    : "—"}
                </td>
                <td className="px-4 py-3">{station.capacity}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(station)}
                      className="btn-outline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(station.id)}
                      className="btn-danger text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!stations.length ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--text-secondary)]" colSpan={4}>
                  No charging stations found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          disabled={offset === 0}
          className="btn-outline text-sm"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={stations.length < PAGE_SIZE}
          className="btn-outline text-sm"
        >
          Next
        </button>
      </div>
    </section>
  );
}
