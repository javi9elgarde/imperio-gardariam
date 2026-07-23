"use client";

interface ConqueredFlag {
  iso: string;
  name: string;
  img: string;
  /* posición en % del lienzo (1672×941) */
  left: number;
  top: number;
  width: number;
  height: number;
}

const FLAGS: ConqueredFlag[] = [
  { iso: "DE", name: "Alemania", img: "/banderas/de.png", left: 42.88, top: 22.21, width: 3.29, height: 3.4 },
  { iso: "AT", name: "Austria", img: "/banderas/at.png", left: 46.65, top: 26.35, width: 3.23, height: 3.51 },
  { iso: "BE", name: "Bélgica", img: "/banderas/be.png", left: 69.2, top: 26.35, width: 3.35, height: 3.51 },
  { iso: "VA", name: "Ciudad del Vaticano", img: "/banderas/va.png", left: 27.63, top: 39.11, width: 3.35, height: 3.4 },
  { iso: "SK", name: "Eslovaquia", img: "/banderas/sk.png", left: 54.13, top: 43.36, width: 3.29, height: 3.4 },
  { iso: "ES", name: "España", img: "/banderas/es.png", left: 61.66, top: 43.36, width: 3.35, height: 3.4 },
  { iso: "HU", name: "Hungría", img: "/banderas/hu.png", left: 69.2, top: 51.86, width: 3.35, height: 3.4 },
  { iso: "IT", name: "Italia", img: "/banderas/it.png", left: 42.88, top: 60.26, width: 3.29, height: 3.4 },
  { iso: "LU", name: "Luxemburgo", img: "/banderas/lu.png", left: 69.2, top: 64.61, width: 3.35, height: 3.4 },
  { iso: "PT", name: "Portugal", img: "/banderas/pt.png", left: 57.89, top: 73.01, width: 3.29, height: 3.51 },
];

interface FlagRoomProps {
  worldVersion: number;
  onSelectCountry: (iso: string, name: string) => void;
}

export default function FlagRoom({ onSelectCountry }: FlagRoomProps) {
  return (
    <div className="froom-wrap">
      <div className="froom-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="froom-base"
          src="/banderas/base.jpg"
          alt="Sala de Banderas"
          draggable={false}
        />

        {FLAGS.map((f) => {
          const tipBelow = f.top < 32;
          return (
            <button
              key={f.iso}
              type="button"
              className={`froom-flag ${tipBelow ? "tip-below" : ""}`}
              aria-label={f.name}
              onClick={() => onSelectCountry(f.iso, f.name)}
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                width: `${f.width}%`,
                height: `${f.height}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="froom-flag-img" src={f.img} alt="" draggable={false} />
              <span className="froom-tip">{f.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
