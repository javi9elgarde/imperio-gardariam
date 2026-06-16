import { BASE_PATH } from "./basePath";

export interface CountryInfo {
  iso: string;
  name: string;
  continent: string;
}

interface RawFeature {
  properties: {
    ISO_A2: string;
    ADMIN?: string;
    NAME?: string;
    CONTINENT?: string;
  };
}

let cache: CountryInfo[] | null = null;
let pending: Promise<CountryInfo[]> | null = null;

export function loadCountriesList(): Promise<CountryInfo[]> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  pending = fetch(`${BASE_PATH}/geo/countries.geojson`)
    .then((r) => r.json())
    .then((data: { features: RawFeature[] }) => {
      const seen = new Set<string>();
      const list: CountryInfo[] = [];
      for (const f of data.features) {
        const iso = f.properties.ISO_A2;
        if (!iso || seen.has(iso)) continue;
        seen.add(iso);
        list.push({
          iso,
          name: f.properties.ADMIN || f.properties.NAME || iso,
          continent: f.properties.CONTINENT || "",
        });
      }
      list.sort((a, b) => a.name.localeCompare(b.name, "es"));
      cache = list;
      return list;
    });

  return pending;
}
