export type ConquestStatus = "none" | "partial" | "full";

export interface PaintStroke {
  weight: number;
  zoom: number;
  color: string;
  eraser: boolean;
  points: [number, number][];
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
  visits: Visit[];
  restaurants: Restaurant[];
  highlights: string[];
}

export const EMPTY_COUNTRY_DATA: CountryData = {
  coverPhoto: "",
  visits: [],
  restaurants: [],
  highlights: [],
};
