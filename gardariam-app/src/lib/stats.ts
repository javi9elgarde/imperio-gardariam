import { getConquestMap, getCountryDataMap } from "./storage";
import type { CountryInfo } from "./worldData";

const REAL_CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
];

export interface ImperialStats {
  conqueredCount: number;
  totalCount: number;
  continentsExplored: number;
  continentsTotal: number;
  totalVisits: number;
  totalDays: number;
  totalRestaurants: number;
  mostVisitedCountry: { iso: string; name: string; count: number } | null;
  busiestYear: { year: number; count: number } | null;
}

export function computeStats(countries: CountryInfo[]): ImperialStats {
  const conquestMap = getConquestMap();
  const dataMap = getCountryDataMap();

  const conqueredIsos = countries
    .filter((c) => (conquestMap[c.iso] ?? "none") !== "none")
    .map((c) => c.iso);
  const conqueredSet = new Set(conqueredIsos);

  const exploredContinents = new Set(
    countries
      .filter((c) => conqueredSet.has(c.iso) && REAL_CONTINENTS.includes(c.continent))
      .map((c) => c.continent),
  );

  let totalVisits = 0;
  let totalDays = 0;
  let totalRestaurants = 0;
  const visitCountByIso: Record<string, number> = {};
  const yearCounts: Record<number, number> = {};

  Object.entries(dataMap).forEach(([iso, data]) => {
    totalVisits += data.visits.length;
    if (data.visits.length > 0) visitCountByIso[iso] = data.visits.length;
    totalRestaurants += data.restaurants.length;
    data.visits.forEach((v) => {
      if (v.dateFrom && v.dateTo) {
        const days = Math.round(
          (new Date(v.dateTo).getTime() - new Date(v.dateFrom).getTime()) / 86400000,
        );
        totalDays += Math.max(1, days);
      }
      if (v.dateFrom) {
        const year = new Date(`${v.dateFrom}T12:00:00`).getFullYear();
        yearCounts[year] = (yearCounts[year] ?? 0) + 1;
      }
    });
  });

  let mostVisitedCountry: ImperialStats["mostVisitedCountry"] = null;
  Object.entries(visitCountByIso).forEach(([iso, count]) => {
    if (!mostVisitedCountry || count > mostVisitedCountry.count) {
      const info = countries.find((c) => c.iso === iso);
      mostVisitedCountry = { iso, name: info?.name ?? iso, count };
    }
  });

  let busiestYear: ImperialStats["busiestYear"] = null;
  Object.entries(yearCounts).forEach(([year, count]) => {
    if (!busiestYear || count > busiestYear.count) {
      busiestYear = { year: Number(year), count };
    }
  });

  return {
    conqueredCount: conqueredIsos.length,
    totalCount: countries.length,
    continentsExplored: exploredContinents.size,
    continentsTotal: REAL_CONTINENTS.length,
    totalVisits,
    totalDays,
    totalRestaurants,
    mostVisitedCountry,
    busiestYear,
  };
}

export interface TimelineEntry {
  iso: string;
  name: string;
  region: string;
  dateFrom: string;
  dateTo: string;
  note: string;
}

export function computeTimeline(countries: CountryInfo[]): TimelineEntry[] {
  const dataMap = getCountryDataMap();
  const entries: TimelineEntry[] = [];

  Object.entries(dataMap).forEach(([iso, data]) => {
    const info = countries.find((c) => c.iso === iso);
    data.visits.forEach((v) => {
      if (!v.dateFrom) return;
      entries.push({
        iso,
        name: info?.name ?? iso,
        region: v.region,
        dateFrom: v.dateFrom,
        dateTo: v.dateTo,
        note: v.note,
      });
    });
  });

  entries.sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  return entries;
}
