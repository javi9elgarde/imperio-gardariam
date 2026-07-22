"use client";

interface RoomObject {
  id: string;
  label: string;
  img: string;
  /* posición en % del lienzo (1672×941) */
  left: number;
  top: number;
  width: number;
  height: number;
  action: { type: "scroll"; target: string } | { type: "link"; href: string };
}

const OBJECTS: RoomObject[] = [
  {
    id: "mapa",
    label: "Mapa de Conquista",
    img: "/room/mapa.png",
    left: 24.581,
    top: 56.535,
    width: 56.4,
    height: 31.243,
    action: { type: "scroll", target: "mapa" },
  },
  {
    id: "banderas",
    label: "Sala de Banderas",
    img: "/room/banderas.png",
    left: 4.306,
    top: 5.526,
    width: 25.359,
    height: 46.653,
    action: { type: "scroll", target: "banderas" },
  },
  {
    id: "libro",
    label: "Cronología",
    img: "/room/libro.png",
    left: 0,
    top: 65.462,
    width: 16.029,
    height: 19.66,
    action: { type: "scroll", target: "cronologia" },
  },
  {
    id: "globo",
    label: "Estadísticas",
    img: "/room/globo.png",
    left: 64.593,
    top: 25.824,
    width: 9.928,
    height: 21.891,
    action: { type: "scroll", target: "estadisticas" },
  },
  {
    id: "telescopio",
    label: "Volver al Hub",
    img: "/room/telescopio.png",
    left: 76.734,
    top: 25.399,
    width: 10.766,
    height: 31.669,
    action: { type: "link", href: "https://gardariam.com" },
  },
];

export default function ConquestRoom() {
  function handle(o: RoomObject) {
    if (o.action.type === "scroll") {
      document.getElementById(o.action.target)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = o.action.href;
    }
  }

  return (
    <section id="hero" className="room-section">
      {/* Relleno difuminado detrás */}
      <div className="room-bg" style={{ backgroundImage: "url(/room/base.png)" }} />
      <div className="room-tint" />

      {/* Escena a proporción del lienzo */}
      <div className="room-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="room-base"
          src="/room/base.png"
          alt="Sala de Conquista de Gardariam"
          draggable={false}
        />

        {OBJECTS.map((o) => (
          <button
            key={o.id}
            type="button"
            className="room-obj"
            aria-label={o.label}
            onClick={() => handle(o)}
            style={{
              left: `${o.left}%`,
              top: `${o.top}%`,
              width: `${o.width}%`,
              height: `${o.height}%`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="room-obj-img" src={o.img} alt="" draggable={false} />
            <span className="room-obj-label">{o.label}</span>
          </button>
        ))}
      </div>

      <div className="room-hint" aria-hidden>
        ▾
      </div>
    </section>
  );
}
