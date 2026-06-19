import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  ConquestStatus,
  CountryData,
  EMPTY_COUNTRY_DATA,
  IconMarker,
  PaintStroke,
} from "./types";

const isBrowser = typeof window !== "undefined";

/* ── Local device preferences (kept in localStorage, not shared) ── */
const PREF_KEYS = {
  color: "gardariam_next_color_v1",
} as const;

function readLocal<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

/* ── Shared world state, mirrored in-memory from Firestore ── */
let conquestCache: Record<string, ConquestStatus> = {};
let paintCache: Record<string, PaintStroke[]> = {};
let countryDataCache: Record<string, CountryData> = {};
let iconsCache: IconMarker[] = [];

let listeners: Array<() => void> = [];

export function onStorageChange(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function notify(): void {
  listeners.forEach((l) => l());
}

let initialized = false;

function initFirestoreSync(): void {
  if (initialized || !isBrowser) return;
  initialized = true;

  onSnapshot(collection(db, "conquests"), (snap) => {
    const next: Record<string, ConquestStatus> = {};
    snap.forEach((d) => {
      next[d.id] = d.data().status as ConquestStatus;
    });
    conquestCache = next;
    notify();
  });

  onSnapshot(collection(db, "paintStrokes"), (snap) => {
    const next: Record<string, PaintStroke[]> = {};
    snap.forEach((d) => {
      next[d.id] = (d.data().strokes as PaintStroke[]) ?? [];
    });
    paintCache = next;
    notify();
  });

  onSnapshot(collection(db, "countryData"), (snap) => {
    const next: Record<string, CountryData> = {};
    snap.forEach((d) => {
      next[d.id] = d.data() as CountryData;
    });
    countryDataCache = next;
    notify();
  });

  onSnapshot(collection(db, "icons"), (snap) => {
    iconsCache = snap.docs.map((d) => d.data() as IconMarker);
    notify();
  });
}

initFirestoreSync();

/* ── Conquest status ────────────────────────────── */
export function getConquestMap(): Record<string, ConquestStatus> {
  return conquestCache;
}

export function getStatus(iso: string): ConquestStatus {
  return conquestCache[iso] ?? "none";
}

export function setStatus(iso: string, status: ConquestStatus): void {
  const next = { ...conquestCache };
  if (status === "none") {
    delete next[iso];
    void deleteDoc(doc(db, "conquests", iso));
  } else {
    next[iso] = status;
    void setDoc(doc(db, "conquests", iso), { status });
  }
  conquestCache = next;
  notify();
}

/* ── Paint strokes ──────────────────────────────── */
export function getPaintMap(): Record<string, PaintStroke[]> {
  return paintCache;
}

export function getStrokes(iso: string): PaintStroke[] {
  return paintCache[iso] ?? [];
}

export function addStroke(iso: string, stroke: PaintStroke): void {
  const strokes = [...(paintCache[iso] ?? []), stroke];
  paintCache = { ...paintCache, [iso]: strokes };
  void setDoc(doc(db, "paintStrokes", iso), { strokes });
  notify();
}

export function clearStrokes(iso: string): void {
  const next = { ...paintCache };
  delete next[iso];
  paintCache = next;
  void deleteDoc(doc(db, "paintStrokes", iso));
  notify();
}

/* ── Country data (visits / restaurants / highlights) ── */
export function getCountryDataMap(): Record<string, CountryData> {
  return countryDataCache;
}

export function getCountryData(iso: string): CountryData {
  return countryDataCache[iso] ?? EMPTY_COUNTRY_DATA;
}

export function setCountryData(iso: string, data: CountryData): void {
  countryDataCache = { ...countryDataCache, [iso]: data };
  void setDoc(doc(db, "countryData", iso), data);
  notify();
}

/* ── Conquest color (per-device preference, stays local) ── */
export const DEFAULT_CONQUEST_COLOR = "#8b1a2a";

export function getConquestColor(): string {
  return readLocal(PREF_KEYS.color, DEFAULT_CONQUEST_COLOR);
}

export function setConquestColor(color: string): void {
  writeLocal(PREF_KEYS.color, color);
}

/* ── Icon markers ───────────────────────────────── */
export function getIconMarkers(): IconMarker[] {
  return iconsCache;
}

export function addIconMarker(marker: IconMarker): void {
  iconsCache = [...iconsCache, marker];
  void setDoc(doc(db, "icons", marker.id), marker);
  notify();
}

export function removeIconMarker(id: string): void {
  iconsCache = iconsCache.filter((m) => m.id !== id);
  void deleteDoc(doc(db, "icons", id));
  notify();
}
