/// <reference types="google.maps" />
"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

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
const FALLBACK_CENTER = { lat: 0.3476, lng: 32.5825 };

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Advanced markers require a Map ID. DEMO_MAP_ID is Google's dev fallback;
// set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID to a cloud-styled map in production.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

// Keeps the viewport fitted to whatever markers are currently shown.
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !markers.length) return;
    if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lon });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lon }));
    map.fitBounds(bounds, 40);
  }, [map, markers]);

  return null;
}

type LocationMapProps = {
  markers: MapMarker[];
  /** Extra classes for the wrapper (height lives here). */
  className?: string;
  emptyLabel?: string;
  /**
   * Notifies the page a pin was clicked. Supplying this makes selection
   * *controlled*: the map stops opening its own InfoWindow and the page renders
   * whatever detail UI it wants instead. Without it the map keeps its built-in
   * title/subtitle bubble.
   */
  onMarkerSelect?: (id: string) => void;
  /** The controlled selection, when the page owns it. */
  selectedId?: string | null;
};

export default function LocationMap({
  markers,
  className,
  emptyLabel = "No known locations to display.",
  onMarkerSelect,
  selectedId: controlledId,
}: LocationMapProps) {
  const [uncontrolledId, setUncontrolledId] = useState<string | null>(null);
  const controlled = onMarkerSelect !== undefined;
  const selectedId = controlled ? controlledId ?? null : uncontrolledId;
  const wrapperClass =
    className ??
    "h-[420px] w-full overflow-hidden rounded-[16px] border border-border";

  // No API key configured — fail gracefully with a hint instead of a blank map.
  if (!API_KEY) {
    return (
      <div className={wrapperClass}>
        <div className="flex h-full items-center justify-center bg-brand-tint-soft p-4 text-center text-sm text-[var(--text-secondary)]">
          Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable it.
        </div>
      </div>
    );
  }

  if (!markers.length) {
    return (
      <div className={wrapperClass}>
        <div className="flex h-full items-center justify-center bg-brand-tint-soft p-4 text-center text-sm text-[var(--text-secondary)]">
          {emptyLabel}
        </div>
      </div>
    );
  }

  const selected = markers.find((m) => m.id === selectedId) ?? null;

  return (
    <div className={wrapperClass}>
      <APIProvider apiKey={API_KEY}>
        <Map
          mapId={MAP_ID}
          defaultCenter={FALLBACK_CENTER}
          defaultZoom={12}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          clickableIcons={false}
          className="h-full w-full"
        >
          <FitBounds markers={markers} />
          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lon }}
              title={marker.title}
              onClick={() =>
                controlled ? onMarkerSelect(marker.id) : setUncontrolledId(marker.id)
              }
            >
              <Pin
                background={marker.tone ?? BRAND_GREEN}
                borderColor="#ffffff"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          ))}

          {selected && !controlled ? (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lon }}
              pixelOffset={[0, -36]}
              onCloseClick={() => setUncontrolledId(null)}
            >
              <div className="text-sm">
                <span className="font-semibold">{selected.title}</span>
                {selected.subtitle ? (
                  <>
                    <br />
                    <span>{selected.subtitle}</span>
                  </>
                ) : null}
              </div>
            </InfoWindow>
          ) : null}
        </Map>
      </APIProvider>
    </div>
  );
}
