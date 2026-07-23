"use client";

import { flagUrl } from "@/lib/format";

interface ConqueredCountry {
  iso: string;
  name: string;
  img: string;
  /* posición en % del lienzo (1402×1122) */
  left: number;
  top: number;
  width: number;
  height: number;
}

const CONQUERED: ConqueredCountry[] = [
  { iso: "PT", name: "Portugal", img: "/mapas/europa/pt.png", left: 3.42, top: 64.79, width: 8.56, height: 13.9 },
  { iso: "ES", name: "España", img: "/mapas/europa/es.png", left: 7.13, top: 61.14, width: 24.82, height: 22.37 },
  { iso: "NL", name: "Países Bajos", img: "/mapas/europa/nl.png", left: 34.74, top: 38.86, width: 6.63, height: 8.29 },
  { iso: "BE", name: "Bélgica", img: "/mapas/europa/be.png", left: 32.81, top: 44.12, width: 6.49, height: 6.51 },
  { iso: "LU", name: "Luxemburgo", img: "/mapas/europa/lu.png", left: 38.37, top: 48.93, width: 1.14, height: 1.52 },
  { iso: "DE", name: "Alemania", img: "/mapas/europa/de.png", left: 38.87, top: 36.9, width: 13.34, height: 20.59 },
  { iso: "AT", name: "Austria", img: "/mapas/europa/at.png", left: 45.29, top: 53.57, width: 11.27, height: 7.31 },
  { iso: "SK", name: "Eslovaquia", img: "/mapas/europa/sk.png", left: 55.99, top: 51.78, width: 9.27, height: 5.53 },
  { iso: "HU", name: "Hungría", img: "/mapas/europa/hu.png", left: 54.85, top: 53.92, width: 13.62, height: 10.34 },
];

interface EuropeMapProps {
  onSelectCountry: (iso: string, name: string) => void;
}

export default function EuropeMap({ onSelectCountry }: EuropeMapProps) {
  return (
    <div className="emap-wrap">
      <div className="emap-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="emap-base"
          src="/mapas/europa/base.jpg"
          alt="Mapa de Europa"
          draggable={false}
        />

        {CONQUERED.map((c) => {
          // los países de la mitad superior muestran la etiqueta debajo (no se corta)
          const tipBelow = c.top < 42;
          return (
            <button
              key={c.iso}
              type="button"
              className={`emap-country ${tipBelow ? "tip-below" : ""}`}
              aria-label={c.name}
              onClick={() => onSelectCountry(c.iso, c.name)}
              style={{
                left: `${c.left}%`,
                top: `${c.top}%`,
                width: `${c.width}%`,
                height: `${c.height}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="emap-country-img" src={c.img} alt="" draggable={false} />
              <span className="emap-tip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="emap-tip-flag" src={flagUrl(c.iso)} alt="" />
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
