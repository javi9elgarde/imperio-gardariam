export type ConquestStatus = "none" | "partial" | "full";

export interface PaintStroke {
  weight: number;
  zoom: number;
  color: string;
  eraser: boolean;
  // Stored as {lat,lng} objects, not [number,number] tuples — Firestore does not
  // support arrays nested directly inside arrays.
  points: { lat: number; lng: number }[];
}

export interface Visit {
  /** identificador propio: permite enlazar una expedición desde la cronología */
  id?: string;
  region: string;
  dateFrom: string;
  dateTo: string;
  note: string;
  photos: string[];
  /* --- Lo propio de ESTA expedición (independiente del país) --- */
  coverPhoto?: string;
  videoUrl?: string;
  restaurants?: Restaurant[];
  highlights?: string[];
}

/** Genera un id estable para una expedición nueva */
export function nuevoVisitId(): string {
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Identificador con el que se abre una expedición. Las guardadas antes de que
 * existiera `id` se referencian por su posición, hasta que el admin las edite.
 */
export function idDeVisita(v: Visit, i: number): string {
  return v.id ?? `i${i}`;
}

/** Busca una expedición por el id que devuelve `idDeVisita` */
export function buscarVisita(visits: Visit[], visitId: string): number {
  const porId = visits.findIndex((v) => v.id === visitId);
  if (porId >= 0) return porId;
  const m = visitId.match(/^i(\d+)$/);
  if (m) {
    const i = Number(m[1]);
    if (i >= 0 && i < visits.length) return i;
  }
  return -1;
}

export interface Restaurant {
  name: string;
  city: string;
  cuisine: string;
  rating: number;
  note: string;
}

export interface CountryData {
  coverPhoto: string;
  videoUrl: string;
  visits: Visit[];
  restaurants: Restaurant[];
  highlights: string[];
}

export const EMPTY_COUNTRY_DATA: CountryData = {
  coverPhoto: "",
  videoUrl: "",
  visits: [],
  restaurants: [],
  highlights: [],
};

export type IconType = "battle" | "next" | "interest" | "danger" | "explore" | "alliance";

export interface IconMarker {
  id: string;
  type: IconType;
  lat: number;
  lng: number;
}
