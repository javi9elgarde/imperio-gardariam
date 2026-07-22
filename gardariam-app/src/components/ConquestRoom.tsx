"use client";

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

interface ConquestRoomProps {
  onNavigate: (target: RoomTarget) => void;
}

export default function ConquestRoom({ onNavigate }: ConquestRoomProps) {
  return (
    <div className="room-section">
      {/* Relleno difuminado detrás */}
      <div className="room-bg" style={{ backgroundImage: "url(/room/room-poster.jpg)" }} />
      <div className="room-tint" />

      {/* Escena animada a proporción del lienzo */}
      <div className="room-scene">
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
    </div>
  );
}
