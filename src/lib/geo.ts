// Location parsing helpers.
//
// The backend returns point locations in two different shapes:
//   - Charging stations + rider-by-id: WKT text, e.g. "POINT(32.58 0.31)"  → lon lat
//   - Riders list endpoint: raw geography::text, which is EWKB hex, e.g.
//     "0101000020E6100000...." → little-endian, SRID-prefixed point.
// parseLatLon accepts either and returns { lat, lon } or null.

export type LatLon = { lat: number; lon: number };

const WKT_POINT = /POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i;

// Decode a little-endian 8-byte IEEE-754 double from a hex string at byteOffset.
function readDoubleLE(hex: string, byteOffset: number): number {
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    const start = (byteOffset + i) * 2;
    bytes[i] = parseInt(hex.substring(start, start + 2), 16);
  }
  return new DataView(bytes.buffer).getFloat64(0, true);
}

// Parse a hex-encoded EWKB point (as produced by geography::text in Postgres).
// Layout: 1 byte endianness, 4 bytes type (may include SRID flag 0x20000000),
// optional 4 bytes SRID, then 8 bytes X (lon) + 8 bytes Y (lat).
function parseEwkbHex(hex: string): LatLon | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 42) return null;

  const littleEndian = hex.substring(0, 2).toLowerCase() === "01";
  if (!littleEndian) return null; // Postgres emits little-endian; skip anything else.

  // Type word (4 bytes) sits at byte offset 1; read it little-endian.
  const typeWord = readUint32LE(hex, 1);
  const hasSrid = (typeWord & 0x20000000) !== 0;

  // Coordinates start after: 1 (endian) + 4 (type) + (hasSrid ? 4 : 0).
  const coordOffset = 1 + 4 + (hasSrid ? 4 : 0);
  const lon = readDoubleLE(hex, coordOffset);
  const lat = readDoubleLE(hex, coordOffset + 8);

  if (!isValidLatLon(lat, lon)) return null;
  return { lat, lon };
}

function readUint32LE(hex: string, byteOffset: number): number {
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    const start = (byteOffset + i) * 2;
    bytes[i] = parseInt(hex.substring(start, start + 2), 16);
  }
  return new DataView(bytes.buffer).getUint32(0, true);
}

export function isValidLatLon(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    !(lat === 0 && lon === 0) // treat null-island as "no location"
  );
}

export function parseLatLon(raw?: string | null): LatLon | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const wkt = value.match(WKT_POINT);
  if (wkt) {
    const lon = Number(wkt[1]);
    const lat = Number(wkt[2]);
    return isValidLatLon(lat, lon) ? { lat, lon } : null;
  }

  return parseEwkbHex(value);
}
