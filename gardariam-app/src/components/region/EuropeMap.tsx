"use client";

import { useState } from "react";
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
  {
    iso: "NL",
    name: "Países Bajos",
    img: "/mapas/europa/paisesbajos.png",
    left: 34.74,
    top: 38.86,
    width: 6.63,
    height: 8.29,
  },
  {
    iso: "BE",
    name: "Bélgica",
    img: "/mapas/europa/belgica.png",
    left: 32.81,
    top: 44.12,
    width: 6.49,
    height: 6.51,
  },
  {
    iso: "PT",
    name: "Portugal",
    img: "/mapas/europa/portugal.png",
    left: 3.42,
    top: 64.79,
    width: 8.56,
    height: 13.9,
  },
];

interface EuropeMapProps {
  onSelectCountry: (iso: string, name: string) => void;
}

export default function EuropeMap({ onSelectCountry }: EuropeMapProps) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="emap-wrap">
      <div className="emap-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="emap-base"
          src="/mapas/europa/base.png"
          alt="Mapa de Europa"
          draggable={false}
        />

        {CONQUERED.map((c) => (
          <button
            key={c.iso}
            type="button"
            className={`emap-country ${hover === c.iso ? "is-hover" : ""}`}
            aria-label={c.name}
            onMouseEnter={() => setHover(c.iso)}
            onMouseLeave={() => setHover((h) => (h === c.iso ? null : h))}
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
        ))}
      </div>
    </div>
  );
}
