"use client";

import { useEffect, useState } from "react";

export type RoomTarget = "mapa" | "banderas" | "cronologia" | "estadisticas" | "hub";

interface RoomObject {
  id: string;
  label: string;
  target: RoomTarget;
  /* posición en % del lienzo (1264×720) */
  left: number;
  top: number;
  width: number;
  height: number;
}

const OBJECTS: RoomObject[] = [
  { id: "mapa", label: "Mapa de Conquista", target: "mapa", left: 24.581, top: 56.535, width: 56.4, height: 31.243 },
  { id: "banderas", label: "Sala de Banderas", target: "banderas", left: 4.306, top: 5.526, width: 25.359, height: 46.653 },
  { id: "libro", label: "Cronología", target: "cronologia", left: 0, top: 65.462, width: 16.029, height: 19.66 },
  { id: "globo", label: "Estadísticas", target: "estadisticas", left: 64.593, top: 25.824, width: 9.928, height: 21.891 },
  { id: "telescopio", label: "Volver al Hub", target: "hub", left: 76.734, top: 25.399, width: 10.766, height: 31.669 },
];

/* Sala vertical (móvil) — lienzo 720×1264, otra distribución de objetos */
const OBJECTS_MOVIL: RoomObject[] = [
  { id: "banderas", label: "Sala de Banderas", target: "banderas", left: 1, top: 12, width: 25, height: 27 },
  { id: "hub", label: "Volver al Hub", target: "hub", left: 76, top: 2, width: 23, height: 22 },
  { id: "mapa", label: "Mapa de Conquista", target: "mapa", left: 24, top: 48, width: 51, height: 25 },
  { id: "libro", label: "Cronología", target: "cronologia", left: 0, top: 64, width: 27, height: 17 },
  { id: "estadisticas", label: "Estadísticas", target: "estadisticas", left: 74, top: 69, width: 24, height: 15 },
];

interface ConquestRoomProps {
  onNavigate: (target: RoomTarget) => void;
}

export default function ConquestRoom({ onNavigate }: ConquestRoomProps) {
  const [pick, setPick] = useState(false);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const check = () =>
      setPick(
        window.location.hash === "#zonas" || window.location.search.includes("zonas"),
      );
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  function onPick(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    setPts((p) => (p.length >= 2 ? [{ x, y }] : [...p, { x, y }]));
  }

  const bbox =
    pts.length === 2
      ? {
          left: Math.min(pts[0].x, pts[1].x),
          top: Math.min(pts[0].y, pts[1].y),
          width: +Math.abs(pts[0].x - pts[1].x).toFixed(1),
          height: +Math.abs(pts[0].y - pts[1].y).toFixed(1),
        }
      : null;

  return (
    <div className="room-section">
      {/* Relleno difuminado detrás */}
      <div className="room-bg" style={{ backgroundImage: "url(/room/room-poster.jpg)" }} />
      <div className="room-bg-movil" />
      <div className="room-tint" />

      {/* Escena escritorio (horizontal) */}
      <div className="room-scene room-scene-desktop">
        <video
          className="room-base-video"
          autoPlay
          loop
          muted
          playsInline
          poster="/room/room-poster.jpg"
          preload="auto"
        >
          <source src="/room/room-loop.mp4" type="video/mp4" />
        </video>

        {OBJECTS.map((o) => (
          <button
            key={o.id}
            type="button"
            className="room-obj"
            aria-label={o.label}
            onClick={() => onNavigate(o.target)}
            style={{
              left: `${o.left}%`,
              top: `${o.top}%`,
              width: `${o.width}%`,
              height: `${o.height}%`,
            }}
          >
            <span className="room-obj-glow" />
            <span className="room-obj-label">{o.label}</span>
          </button>
        ))}
      </div>

      {/* Escena móvil (vertical) — zonas parpadeantes */}
      <div className="room-scene room-scene-movil">
        <video
          className="room-base-video"
          autoPlay
          loop
          muted
          playsInline
          poster="/room/room-poster-mobile.jpg"
          preload="auto"
        >
          <source src="/room/room-loop-mobile.mp4" type="video/mp4" />
        </video>

        {OBJECTS_MOVIL.map((o) => (
          <button
            key={o.id}
            type="button"
            className="room-obj room-obj-movil"
            aria-label={o.label}
            onClick={() => onNavigate(o.target)}
            style={{
              left: `${o.left}%`,
              top: `${o.top}%`,
              width: `${o.width}%`,
              height: `${o.height}%`,
            }}
          >
            <span className="room-obj-glow" />
            <span className="room-obj-label">{o.label}</span>
          </button>
        ))}

        {pick && (
          <div className="room-pick" onClick={onPick}>
            {pts.map((p, i) => (
              <span
                key={i}
                className="room-pick-dot"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {pick && (
        <div className="room-pick-panel">
          {pts.length < 2
            ? `Toca esquina sup-izq y luego inf-der de la zona (${pts.length}/2)`
            : bbox &&
              `left: ${bbox.left}, top: ${bbox.top}, width: ${bbox.width}, height: ${bbox.height}`}
          {pts.length === 2 && "  ·  toca de nuevo para otra zona"}
        </div>
      )}
    </div>
  );
}
