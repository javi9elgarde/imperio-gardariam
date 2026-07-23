"use client";

import { useState } from "react";
import BackToRoom from "@/components/BackToRoom";
import EuropeMap from "./EuropeMap";

interface Region {
  id: string;
  name: string;
  discovered: boolean;
}

const REGIONS: Region[] = [
  { id: "europa", name: "Europa", discovered: true },
  { id: "asia", name: "Asia", discovered: false },
  { id: "america", name: "América", discovered: false },
  { id: "africa", name: "África", discovered: false },
  { id: "oceania", name: "Oceanía", discovered: false },
];

interface MapZoneProps {
  onSelectCountry: (iso: string, name: string) => void;
  onBackToRoom: () => void;
}

export default function MapZone({ onSelectCountry, onBackToRoom }: MapZoneProps) {
  const [region, setRegion] = useState<string | null>(null);

  if (region === "europa") {
    return (
      <div className="mapzone">
        <EuropeMap onSelectCountry={onSelectCountry} />
        <button type="button" className="back-to-room" onClick={() => setRegion(null)}>
          <span aria-hidden>←</span> Regiones
        </button>
      </div>
    );
  }

  return (
    <div className="mapzone region-selector">
      <div className="region-inner">
        <h2 className="region-title">Mapa de Conquista</h2>
        <div className="region-divider" />
        <p className="region-sub">Elige una región del mundo</p>

        <div className="region-grid">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`region-card ${r.discovered ? "discovered" : "locked"}`}
              disabled={!r.discovered}
              onClick={() => r.discovered && setRegion(r.id)}
              style={
                r.discovered
                  ? { backgroundImage: "url(/mapas/europa/base.jpg)" }
                  : undefined
              }
            >
              <span className="region-card-shade" />
              <span className="region-card-name">{r.name}</span>
              {!r.discovered && <span className="region-seal">Sin descubrir</span>}
            </button>
          ))}
        </div>
      </div>

      <BackToRoom onClick={onBackToRoom} />
    </div>
  );
}
