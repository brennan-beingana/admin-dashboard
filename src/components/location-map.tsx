"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  lat: number;
  lon: number;
  title: string;
  subtitle?: string;
  /** Marker colour. Defaults to the brand green. */
  tone?: string;
};

const BRAND_GREEN = "#7AC143";

// Kampala — a sensible default centre when there are no markers to fit.
const FALLBACK_CENTER: [number, number] = [0.3476, 32.5825];

function pinIcon(color: string): L.DivIcon {
  const html = `
    <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 9.2 11.5 20 12 20.5.3.3.7.3 1 0 .5-.5 13-11.3 13-20.5C26 5.82 20.18 0 13 0z"
        fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="13" cy="13" r="5" fill="#ffffff"/>
    </svg>`;
  return L.divIcon({
    html,
    className: "", // strip Leaflet's default styling
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

// Keeps the viewport fitted to whatever markers are currently shown.
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lon], 14);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, markers]);

  return null;
}

type LocationMapProps = {
  markers: MapMarker[];
  /** Extra classes for the wrapper (height lives here). */
  className?: string;
  emptyLabel?: string;
};

export default function LocationMap({
  markers,
  className,
  emptyLabel = "No known locations to display.",
}: LocationMapProps) {
  const iconCache = useMemo(() => new Map<string, L.DivIcon>(), []);
  const getIcon = (tone: string) => {
    let icon = iconCache.get(tone);
    if (!icon) {
      icon = pinIcon(tone);
      iconCache.set(tone, icon);
    }
    return icon;
  };

  return (
    <div className={className ?? "h-[420px] w-full overflow-hidden rounded-[16px] border border-border"}>
      {!markers.length ? (
        <div className="flex h-full items-center justify-center bg-brand-tint-soft p-4 text-center text-sm text-[var(--text-secondary)]">
          {emptyLabel}
        </div>
      ) : (
        <MapContainer
          center={FALLBACK_CENTER}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={markers} />
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lon]}
              icon={getIcon(marker.tone ?? BRAND_GREEN)}
            >
              <Popup>
                <span className="font-semibold">{marker.title}</span>
                {marker.subtitle ? (
                  <>
                    <br />
                    <span>{marker.subtitle}</span>
                  </>
                ) : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
