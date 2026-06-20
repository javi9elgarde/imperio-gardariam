import { BASE_PATH } from "./basePath";
import { slugify } from "./slug";

interface ProvinceFeature {
  properties: { name?: string };
}

let cache: Record<string, string> | null = null;
let pending: Promise<Record<string, string>> | null = null;

export function loadProvinceNames(): Promise<Record<string, string>> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = fetch(`${BASE_PATH}/geo/spain-ccaa-simple.geojson`)
    .then((r) => r.json())
    .then((data) => {
      const map: Record<string, string> = {};
      (data.features as ProvinceFeature[]).forEach((f) => {
        const name = f.properties?.name || "";
        if (name) map[`ES-${slugify(name)}`] = name;
      });
      cache = map;
      return map;
    });
  return pending;
}
