"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChargingStation,
  deleteChargingStation,
  getChargingStations,
  updateChargingStation,
  unwrapError,
} from "@/lib/api";

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

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const startEdit = (station: (typeof stations)[number]) => {
    // Parse location from PostGIS point format: "POINT(lon lat)"
    let lat = "";
    let lon = "";
    
    if (station.location && typeof station.location === "string") {
      const match = station.location.match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)/i);
      if (match) {
        lon = match[1];
        lat = match[2];
      }
    }
    
    setEditingId(station.id);
    setForm({
      name: station.name,
      lat,
      lon,
      capacity: String(station.capacity ?? 1),
      meta: JSON.stringify(station.meta ?? {}, null, 2),
    });
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Charging Stations</h1>
        <p className="text-sm text-foreground/70">Create, update, and remove charging stations.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 p-4">
        <h2 className="text-lg font-semibold">{editingId ? "Update Station" : "Create Station"}</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-md border border-black/15 px-3 py-2"
            placeholder="Station name"
          />
          <input
            required
            value={form.lat}
            onChange={(event) => setForm((prev) => ({ ...prev, lat: event.target.value }))}
            className="rounded-md border border-black/15 px-3 py-2"
            placeholder="Latitude"
          />
          <input
            required
            value={form.lon}
            onChange={(event) => setForm((prev) => ({ ...prev, lon: event.target.value }))}
            className="rounded-md border border-black/15 px-3 py-2"
            placeholder="Longitude"
          />
          <input
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
            className="rounded-md border border-black/15 px-3 py-2"
            placeholder="Capacity"
          />
          <textarea
            value={form.meta}
            onChange={(event) => setForm((prev) => ({ ...prev, meta: event.target.value }))}
            className="md:col-span-2 min-h-28 rounded-md border border-black/15 px-3 py-2"
            placeholder='Meta JSON e.g. { "operator": "EV Uganda" }'
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={isMutating}
            className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
          >
            {editingId ? (isMutating ? "Updating..." : "Update") : isMutating ? "Creating..." : "Create"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-md border border-black/15 px-4 py-2"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {stationsQuery.error || actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError ?? unwrapError(stationsQuery.error)}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Capacity</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr key={station.id} className="border-t border-black/10">
                <td className="px-3 py-2">{station.name}</td>
                <td className="px-3 py-2 text-sm text-foreground/70">{station.location}</td>
                <td className="px-3 py-2">{station.capacity}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => startEdit(station)}
                    className="rounded-md border border-black/15 px-2 py-1 hover:bg-black/5 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(station.id)}
                    className="rounded-md border border-black/15 px-2 py-1 hover:bg-black/5"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!stations.length ? (
              <tr>
                <td className="px-3 py-4 text-center text-foreground/70" colSpan={4}>
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
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={stations.length < PAGE_SIZE}
          className="rounded-md border border-black/15 px-3 py-2 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </section>
  );
}
