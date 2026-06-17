import {
  ConquestStatus,
  CountryData,
  EMPTY_COUNTRY_DATA,
  IconMarker,
  PaintStroke,
} from "./types";

const isBrowser = typeof window !== "undefined";

const KEYS = {
  conquest: "gardariam_next_conquest_v1",
  paint: "gardariam_next_paint_v1",
  countryData: "gardariam_next_country_data_v1",
  color: "gardariam_next_color_v1",
  icons: "gardariam_next_icons_v1",
} as const;

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

/* ── Conquest status ────────────────────────────── */
export function getConquestMap(): Record<string, ConquestStatus> {
  return readJSON(KEYS.conquest, {});
}

export function getStatus(iso: string): ConquestStatus {
  return getConquestMap()[iso] ?? "none";
}

export function setStatus(iso: string, status: ConquestStatus): void {
  const map = getConquestMap();
  if (status === "none") delete map[iso];
  else map[iso] = status;
  writeJSON(KEYS.conquest, map);
}

/* ── Paint strokes ──────────────────────────────── */
export function getPaintMap(): Record<string, PaintStroke[]> {
  return readJSON(KEYS.paint, {});
}

export function getStrokes(iso: string): PaintStroke[] {
  return getPaintMap()[iso] ?? [];
}

export function addStroke(iso: string, stroke: PaintStroke): void {
  const map = getPaintMap();
  if (!map[iso]) map[iso] = [];
  map[iso].push(stroke);
  writeJSON(KEYS.paint, map);
}

export function clearStrokes(iso: string): void {
  const map = getPaintMap();
  delete map[iso];
  writeJSON(KEYS.paint, map);
}

/* ── Country data (visits / restaurants / highlights) ── */
export function getCountryDataMap(): Record<string, CountryData> {
  return readJSON(KEYS.countryData, {});
}

export function getCountryData(iso: string): CountryData {
  return getCountryDataMap()[iso] ?? EMPTY_COUNTRY_DATA;
}

export function setCountryData(iso: string, data: CountryData): void {
  const map = getCountryDataMap();
  map[iso] = data;
  writeJSON(KEYS.countryData, map);
}

/* ── Conquest color ─────────────────────────────── */
export const DEFAULT_CONQUEST_COLOR = "#8b1a2a";

export function getConquestColor(): string {
  return readJSON(KEYS.color, DEFAULT_CONQUEST_COLOR);
}

export function setConquestColor(color: string): void {
  writeJSON(KEYS.color, color);
}

/* ── Icon markers ───────────────────────────────── */
export function getIconMarkers(): IconMarker[] {
  return readJSON(KEYS.icons, []);
}

export function addIconMarker(marker: IconMarker): void {
  const markers = getIconMarkers();
  markers.push(marker);
  writeJSON(KEYS.icons, markers);
}

export function removeIconMarker(id: string): void {
  const markers = getIconMarkers().filter((m) => m.id !== id);
  writeJSON(KEYS.icons, markers);
}
