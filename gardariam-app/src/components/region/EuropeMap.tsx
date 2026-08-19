"use client";

import { useEffect, useState } from "react";
import { flagUrl } from "@/lib/format";
import { playEnter, playHover, playPick } from "@/lib/sound";

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
  { iso: "IT", name: "Italia", img: "/mapas/europa/it.png", left: 38.87, top: 58.91, width: 20.47, height: 30.3 },
];

interface EuropeMapProps {
  onSelectCountry: (iso: string, name: string) => void;
}

export default function EuropeMap({ onSelectCountry }: EuropeMapProps) {
  const [tactil, setTactil] = useState(false);
  /* Sin puntero no se puede "pasar por encima": el primer toque enseña de qué
     país se trata y el segundo abre su ficha. */
  const [armado, setArmado] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const upd = () => setTactil(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  function tocar(c: ConqueredCountry) {
    if (!tactil) {
      playEnter();
      onSelectCountry(c.iso, c.name);
      return;
    }
    if (armado !== c.iso) {
      setArmado(c.iso);
      playPick();
      return;
    }
    setArmado(null);
    playEnter();
    onSelectCountry(c.iso, c.name);
  }

  const elegido = CONQUERED.find((c) => c.iso === armado) ?? null;

  return (
    <div className="emap-wrap">
      <div className="emap-scene">
        {/* tocar fuera de un país deshace la selección */}
        {armado && (
          <div className="emap-desarmar" onClick={() => setArmado(null)} aria-hidden />
        )}

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
              className={`emap-country ${tipBelow ? "tip-below" : ""} ${
                armado === c.iso ? "is-armado" : ""
              }`}
              aria-label={armado === c.iso ? `Abrir ${c.name}` : c.name}
              onPointerEnter={() => !tactil && playHover()}
              onFocus={() => !tactil && playHover()}
              onClick={() => tocar(c)}
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
                <span className="emap-tip-txt">
                  {c.name}
                  {armado === c.iso && <i>Toca otra vez para abrir</i>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Móvil: barra inferior con el país señalado. Un cartel flotante se
          sale de la pantalla en los países del borde; así siempre se lee. */}
      {tactil && elegido && (
        <div className="emap-barra" role="status">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="emap-barra-flag" src={flagUrl(elegido.iso)} alt="" />
          <span className="emap-barra-nombre">{elegido.name}</span>
          <button
            type="button"
            className="emap-barra-btn"
            onClick={() => {
              setArmado(null);
              playEnter();
              onSelectCountry(elegido.iso, elegido.name);
            }}
          >
            Abrir ficha ›
          </button>
        </div>
      )}
    </div>
  );
}
