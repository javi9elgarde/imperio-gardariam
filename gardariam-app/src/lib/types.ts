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
  region: string;
  dateFrom: string;
  dateTo: string;
  note: string;
  photos: string[];
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
