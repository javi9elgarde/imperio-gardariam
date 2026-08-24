"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { playBack } from "@/lib/sound";

interface Props {
  onClose: () => void;
}

type Tab = "resumen" | "itinerario" | "checklist" | "docs";

function mapsUrl(q: string): string {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
}

interface Dest {
  flag: string;
  name: string;
  dates: string;
  nights: number;
  hotel: string;
  addr: string;
  price: string;
}

const DESTS: Dest[] = [
  { flag: "🇲🇾", name: "Kuala Lumpur", dates: "1–2 sep", nights: 1, hotel: "The Manor Serviced Residence", addr: "Persiaran Stonor, KLCC", price: "48 €" },
  { flag: "🇸🇬", name: "Singapur", dates: "2–4 sep", nights: 2, hotel: "Lyf Funan Singapore", addr: "107 North Bridge Rd, City Hall", price: "a confirmar" },
  { flag: "🇮🇩", name: "Tanah Lot (Bali)", dates: "4–6 sep", nights: 2, hotel: "Curve Villas Boutique Resort", addr: "Kedungu, Tanah Lot", price: "131 €" },
  { flag: "🇮🇩", name: "Ubud (Bali)", dates: "6–11 sep", nights: 5, hotel: "Honeymoon Guesthouse", addr: "Ubud", price: "139 €" },
  { flag: "🇮🇩", name: "Nusa Dua (Bali)", dates: "11–14 sep", nights: 3, hotel: "Ayodya Resort Bali", addr: "todo incluido", price: "741 €" },
];

interface Flight {
  date: string;
  route: string;
  air: string;
  dep: string;
  arr: string;
  dur: string;
}

const FLIGHTS: Flight[] = [
  { date: "31 AGO", route: "Madrid → Doha", air: "QR150 · Qatar Airways", dep: "15:45", arr: "23:30", dur: "6h45" },
  { date: "1 SEP", route: "Doha → Kuala Lumpur", air: "QR852 · Qatar Airways", dep: "02:35", arr: "15:15", dur: "7h40" },
  { date: "2 SEP", route: "Kuala Lumpur → Singapur", air: "OD807 · Batik Air", dep: "15:10", arr: "16:10", dur: "1h00" },
  { date: "4 SEP", route: "Singapur → Bali", air: "TR282 · Scoot", dep: "16:00", arr: "18:45", dur: "2h45" },
  { date: "14 SEP", route: "Bali → Doha", air: "QR963 · Qatar Airways", dep: "19:20", arr: "23:30", dur: "9h10" },
  { date: "15 SEP", route: "Doha → Madrid", air: "QR147 · Qatar Airways", dep: "01:25", arr: "07:35", dur: "7h10" },
];

const BUDGET: [string, string][] = [
  ["Vuelos (Madrid–KL–Singapur–Bali–Madrid)", "1.797,60 €"],
  ["Seguro de viaje IATI", "248,80 €"],
  ["Alojamiento Kuala Lumpur (1 noche)", "48 €"],
  ["Alojamiento Singapur — Lyf Funan (2 noches)", "a confirmar"],
  ["Alojamiento Tanah Lot (2 noches)", "131 €"],
  ["Alojamiento Ubud (5 noches)", "139 €"],
  ["Alojamiento Nusa Dua (3 noches, todo incluido)", "741 €"],
  ["Guía/chófer en español, Ubud (4 × 70 €)", "280 €"],
  ["Entradas Universal Studios (aprox.)", "100 €"],
];
const BUDGET_TOTAL = "3.485,40 €";

type Zone = "kl" | "sg" | "bali" | "flight";

interface Place {
  n: string;
  d?: string;
}

interface Day {
  n: number;
  date: string;
  zone: Zone;
  country: string;
  title: string;
  items: string[];
  transport?: string;
  places?: Place[];
  food?: Place[];
}

const DAYS: Day[] = [
  { n: 1, date: "Lun 31 ago", zone: "flight", country: "En vuelo", title: "Madrid → Doha", items: [
    "15:45 salida de Madrid-Barajas (T4S) en QR150.",
    "Noche a bordo; llegada a Doha (Hamad) a las 23:30.",
  ] },
  { n: 2, date: "Mar 1 sep", zone: "kl", country: "Malasia", title: "Llegada a Kuala Lumpur", items: [
    "02:35 salida de Doha en QR852 · llegada a KL (T1) a las 15:15.",
    "Sacar dinero en el cajero (ATM) — evitar la conversión de la máquina, cobrar en MYR.",
    "Tren KLIA Ekspres al centro (KL Sentral) y luego Grab hasta el hotel.",
    "Check-in en The Manor Serviced Residence (Persiaran Stonor, KLCC).",
    "Grab a Plaza Merdeka y Chinatown — si no da tiempo, quedarse en zona Petronas y Jalan Alor.",
    "Comida típica a probar: Hokkien Mee, Chicken Rice estilo Hainán, Charsiew Rice, Nasi/Mee Goreng.",
    "20:00 o 21:00: espectáculo de las fuentes de las Torres Petronas.",
    "Cena en Restoran Mon (Chinese Beef Roti) y paseo por Jalan Alor.",
    "Para cerrar: mirador SkyBar (Traders Hotel).",
  ], transport: "KLIA Ekspres (aeropuerto → KL Sentral) + Grab al hotel.",
    places: [
      { n: "The Manor Serviced Residence", d: "vuestro hotel" },
      { n: "Torres Petronas", d: "fuentes 20:00/21:00" },
      { n: "Plaza Merdeka", d: "casco histórico" },
      { n: "Chinatown Kuala Lumpur" },
      { n: "Jalan Alor Food Street", d: "comida callejera" },
      { n: "SkyBar Traders Hotel Kuala Lumpur", d: "mirador" },
    ],
    food: [{ n: "Restoran Mon", d: "Chinese Beef Roti" }, { n: "Jalan Alor Food Street", d: "satay, mariscos, fideos" }] },
  { n: 3, date: "Mié 2 sep", zone: "kl", country: "Malasia → Singapur", title: "Kuala Lumpur → Singapur", items: [
    "Desayuno temprano y Cuevas de Batu (cubrir hombros/rodillas).",
    "Terminar de ver Chinatown y Plaza Merdeka si no dio tiempo.",
    "Check-out y traslado al aeropuerto.",
    "15:10 vuelo OD807 a Singapur · llegada 16:10 (T4).",
    "Check-in en Lyf Funan Singapore (107 North Bridge Road).",
    "Jewel Changi — cascada Rain Vortex, si se pasa por el aeropuerto.",
    "MRT línea verde EW (Changi → Tuas Link) o Grab directo al hotel.",
    "Merlion Park, junto al río Singapur.",
    "Si sobra tiempo: Flower Dome y Cloud Forest (Gardens by the Bay).",
    "20:00/21:00: espectáculo Spectra en Marina Bay Sands.",
    "20:45: espectáculo de luces en Gardens by the Bay.",
    "Cena en Lau Pa Sat.",
  ], places: [
    { n: "Batu Caves", d: "ir temprano" },
    { n: "Lyf Funan Singapore", d: "vuestro hotel" },
    { n: "Jewel Changi Airport", d: "Rain Vortex" },
    { n: "Merlion Park Singapore" },
    { n: "Gardens by the Bay", d: "show 20:45" },
    { n: "Marina Bay Sands", d: "Spectra 20:00/21:00" },
  ], food: [{ n: "Lau Pa Sat", d: "mercado, calle del satay" }] },
  { n: 4, date: "Jue 3 sep", zone: "sg", country: "Singapur", title: "Universal Studios", items: [
    "Metro o Grab a Universal Studios Singapore (Sentosa).",
    "Día completo en el parque — entradas ya incluidas.",
    "Vuelta a Little India y Chinatown por la tarde/noche.",
    "Si sobra tiempo: Flower Dome / Cloud Forest antes de las 21:00.",
  ], places: [{ n: "Universal Studios Singapore" }, { n: "Little India Singapore" }, { n: "Chinatown Singapore" }] },
  { n: 5, date: "Vie 4 sep", zone: "sg", country: "Singapur → Indonesia", title: "Singapur → Bali", items: [
    "Mañana: regalitos y compras por Singapur.",
    "En el aeropuerto sobre las 14:00.",
    "16:00 vuelo TR282 a Bali · llegada a Ngurah Rai 18:45.",
    "Sacar/activar SIM Telkomsel.",
    "Grab al hotel y check-in en Curve Villas Boutique Resort.",
  ], places: [{ n: "Curve Villas Boutique Resort Tanah Lot", d: "vuestro hotel" }] },
  { n: 6, date: "Sáb 5 sep", zone: "bali", country: "Indonesia (Bali)", title: "Tanah Lot · Kedungu", items: [
    "Mañana de playa y relax en Kedungu Beach.",
    "Comer cerca de la villa.",
    "Tarde: Templo de Tanah Lot al atardecer (18:00–18:30).",
  ], places: [{ n: "Kedungu Beach Bali" }, { n: "Tanah Lot Temple", d: "atardecer 18:00–18:30" }] },
  { n: 7, date: "Dom 6 sep", zone: "bali", country: "Indonesia (Bali)", title: "Tanah Lot → Ubud", items: [
    "Check-out de Curve Villas y traslado a Ubud.",
    "Check-in en Honeymoon Guesthouse.",
    "Tarde: Ubud Street Market, Pura Taman Saraswati y paseo por el centro.",
    "Cena en Wedja Restaurant o Merlin's.",
  ], transport: "Traslado privado Tanah Lot → Ubud, ~1h.",
    places: [{ n: "Honeymoon Guesthouse Ubud", d: "vuestro hotel" }, { n: "Ubud Street Market" }, { n: "Pura Taman Saraswati" }],
    food: [{ n: "Wedja Restaurant Ubud" }, { n: "Merlin's Ubud" }] },
  { n: 8, date: "Lun 7 sep", zone: "bali", country: "Indonesia (Bali)", title: "Ubud — Tour 1 con guía", items: [
    "Día completo con guía en español (70 € la pareja el día):",
    "Danza típica · Templo Sukawati · artesanía · Ki Pasung Gerigis · Tegallalang · Templo Gunung Kawi Sebatu · café y té.",
  ], places: [{ n: "Tegallalang Rice Terrace Bali" }, { n: "Pura Gunung Kawi Sebatu" }] },
  { n: 9, date: "Mar 8 sep", zone: "bali", country: "Indonesia (Bali)", title: "Ubud — Tour 2 con guía", items: [
    "Templo Goa Lawah · snorkel · Templo de Besakih · Templo Goa Garba.",
  ], places: [{ n: "Pura Goa Lawah" }, { n: "Pura Besakih" }] },
  { n: 10, date: "Mié 9 sep", zone: "bali", country: "Indonesia (Bali)", title: "Ubud — Tour 3 con guía", items: [
    "Rafting · cascada Uma Anyar · Templo Batur (volcán) · Parque de mariposas.",
  ], places: [{ n: "Mount Batur" }] },
  { n: 11, date: "Jue 10 sep", zone: "bali", country: "Indonesia (Bali)", title: "Ubud — Tour 5 con guía", items: [
    "Lagos Buyan y Tamblingan · Templo del lago Beratan · Wanagiri Hidden Hill · cascada Pucak Manik.",
  ], places: [{ n: "Ulun Danu Beratan Temple" }, { n: "Wanagiri Hidden Hill" }] },
  { n: 12, date: "Vie 11 sep", zone: "bali", country: "Indonesia (Bali)", title: "Ubud → Nusa Dua", items: [
    "Mañana libre en Ubud: Beji Griya Waterfall Temple, Pura Puseh Desa Batuan o compras finales.",
    "Check-out y traslado por cuenta propia hacia el sur.",
    "Parada en Garuda Wisnu Kencana (GWK).",
    "Check-in en Ayodya Resort Bali (todo incluido), Nusa Dua.",
  ], transport: "Taxi/Grab Ubud → Nusa Dua vía GWK, ~1h30.",
    places: [{ n: "Garuda Wisnu Kencana" }, { n: "Ayodya Resort Bali", d: "vuestro hotel" }] },
  { n: 13, date: "Sáb 12 sep", zone: "bali", country: "Indonesia (Bali)", title: "Nusa Dua — todo incluido", items: [
    "Día de playa y piscina en el resort.",
    "Para una noche especial: cena en Koral (The Apurva Kempinski).",
  ], food: [{ n: "Koral Bali's First Aquarium Restaurant", d: "The Apurva Kempinski" }] },
  { n: 14, date: "Dom 13 sep", zone: "bali", country: "Indonesia (Bali)", title: "Nusa Dua", items: [
    "Día libre, o excursión opcional a Uluwatu: templo y danza Kecak al atardecer.",
  ], places: [{ n: "Uluwatu Temple", d: "danza Kecak" }] },
  { n: 15, date: "Lun 14 sep", zone: "bali", country: "Indonesia → Catar", title: "Nusa Dua → vuelo a Doha", items: [
    "Mañana libre, última playa y check-out.",
    "Traslado al aeropuerto de Ngurah Rai.",
    "19:20 vuelo QR963 a Doha · llegada 23:30.",
  ], transport: "Resort → aeropuerto, ~20–25 min." },
  { n: 16, date: "Mar 15 sep", zone: "flight", country: "En vuelo", title: "Doha → Madrid", items: [
    "01:25 vuelo QR147 · llegada a Madrid-Barajas (T4S) a las 07:35.",
    "Fin del viaje — ¡feliz luna de miel!",
  ] },
];

const MALETA = ["Ropa ligera y transpirable (+1 muda de abrigo para el avión)", "Calzado cómodo y sandalias", "Crema solar (factor alto, resistente al agua)", "Repelente de mosquitos", "Mochila pequeña para excursiones", "Cargadores + batería externa", "Chubasquero ligero o paraguas de bolsillo", "Cámara de fotos", "Billetes/documentación descargada"];
const ANTES = ["Tarjeta SIM — hecho", "Guía turística — hecho", "Cargadores tipo G — hecho", "Billetes y monedas locales", "Vacunas — hecho", "Visados", "Entradas Universal Studios — hecho", "Actividades", "MDAC (72h antes de Malasia)", "SG Arrival Card (72h antes de Singapur)"];
const CONTACTS = ["Asistencia seguro IATI", "Guía en Ubud (Ayu)", "Hoteles (WhatsApp)", "Emergencia España"];

function useChecklist(key: string, items: string[]) {
  const [state, setState] = useState<Record<number, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  });
  function toggle(i: number) {
    setState((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }
  const done = items.reduce((t, _, i) => t + (state[i] ? 1 : 0), 0);
  return { state, toggle, done };
}

function DayCard({ day }: { day: Day }) {
  const [open, setOpen] = useState(false);
  const { state: checks, toggle } = useChecklist(`viaje-day-${day.n}`, day.items);
  const done = day.items.reduce((t, _, i) => t + (checks[i] ? 1 : 0), 0);
  return (
    <div className={`viaje-day viaje-day-zone-${day.zone} ${open ? "is-open" : ""}`}>
      <button type="button" className="viaje-day-head" onClick={() => setOpen((o) => !o)}>
        <span className="viaje-daynum">{String(day.n).padStart(2, "0")}</span>
        <span className="viaje-day-title-wrap">
          <span className="viaje-day-title">{day.title}</span>
          <span className="viaje-day-sub" style={{ display: "block" }}>
            {day.date.toUpperCase()} · {day.country}
          </span>
        </span>
        <span className="viaje-day-done">{done}/{day.items.length}</span>
        <span className="viaje-day-chev">▸</span>
      </button>
      {open && (
        <div className="viaje-day-body">
          <div className="viaje-day-items">
            {day.items.map((it, i) => (
              <div className="viaje-check-item" key={i}>
                <input
                  type="checkbox"
                  id={`d${day.n}-${i}`}
                  checked={!!checks[i]}
                  onChange={() => toggle(i)}
                />
                <label htmlFor={`d${day.n}-${i}`} className={checks[i] ? "is-done" : ""}>
                  {it}
                </label>
              </div>
            ))}
          </div>
          {day.transport && <div className="viaje-transport">🚗 {day.transport}</div>}
          {day.places && day.places.length > 0 && (
            <>
              <div className="viaje-mini-h">Lugares</div>
              {day.places.map((p, i) => (
                <a
                  key={i}
                  className="viaje-place-row"
                  href={mapsUrl(p.n)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <span className="viaje-place-name">{p.n}</span>
                  <span className="viaje-place-desc">{p.d}</span>
                </a>
              ))}
            </>
          )}
          {day.food && day.food.length > 0 && (
            <>
              <div className="viaje-mini-h">Dónde comer</div>
              {day.food.map((f, i) => (
                <a
                  key={i}
                  className="viaje-food-row"
                  href={mapsUrl(f.n)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <span className="viaje-place-name">🍽 {f.n}</span>
                  <span className="viaje-place-desc">{f.d}</span>
                </a>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistBlock({ storageKey, items }: { storageKey: string; items: string[] }) {
  const { state, toggle, done } = useChecklist(storageKey, items);
  const pct = items.length ? (done / items.length) * 100 : 0;
  return (
    <>
      <div className="viaje-progress-wrap">
        <div className="viaje-progress-bar">
          <div className="viaje-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="viaje-progress-txt">
          {done} / {items.length}
        </span>
      </div>
      <div className="exp-card">
        {items.map((txt, i) => (
          <div className="viaje-check-item" key={i}>
            <input
              type="checkbox"
              id={`${storageKey}-${i}`}
              checked={!!state[i]}
              onChange={() => toggle(i)}
            />
            <label htmlFor={`${storageKey}-${i}`} className={state[i] ? "is-done" : ""}>
              {txt}
            </label>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ProximoViajePanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [contacts, setContacts] = useState<Record<number, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("viaje-contacts") || "{}");
    } catch {
      return {};
    }
  });

  function setContact(i: number, value: string) {
    setContacts((prev) => {
      const next = { ...prev, [i]: value };
      localStorage.setItem("viaje-contacts", JSON.stringify(next));
      return next;
    });
  }

  function cerrar() {
    playBack();
    onClose();
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "itinerario", label: "Itinerario" },
    { id: "checklist", label: "Checklist" },
    { id: "docs", label: "Docs" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="country-overlay"
      onClick={cerrar}
    >
      <motion.div
        initial={{ y: 28, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pergamino-panel country-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={cerrar} aria-label="Cerrar" className="pnl-close">
          ✕
        </button>

        <div style={{ padding: "1.1rem 1.1rem 0" }}>
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9c6a1e", margin: 0 }}>
            Luna de miel · 2026
          </p>
          <h2 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.4rem", margin: "0.1rem 0 0.2rem", color: "#3a2c1a" }}>
            🇲🇾 Malasia · 🇸🇬 Singapur · 🇮🇩 Bali
          </h2>
          <p style={{ fontSize: "0.68rem", color: "#6f5c3c", margin: 0 }}>31 ago — 15 sep 2026 · 16 días</p>
        </div>

        <div className="pergamino-body country-body">
          <div className="country-scroll">
            <div className="viaje-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`viaje-tab-btn ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "resumen" && (
              <div>
                <div className="viaje-mini-h" style={{ marginTop: 0 }}>Destinos y alojamiento</div>
                {DESTS.map((d, i) => (
                  <div className="viaje-dest" key={i}>
                    <div className="viaje-dest-top">
                      <span>{d.flag} {d.name}</span>
                      <span className="viaje-dest-price">{d.price}</span>
                    </div>
                    <div className="viaje-dest-meta">{d.dates} · {d.nights} noche(s)</div>
                    <div className="viaje-dest-hotel">{d.hotel}</div>
                    <a className="viaje-maplink" href={mapsUrl(`${d.hotel}, ${d.addr}`)} target="_blank" rel="noopener noreferrer">
                      📍 {d.addr} — abrir en Maps
                    </a>
                  </div>
                ))}

                <div className="viaje-mini-h">Vuelos</div>
                {FLIGHTS.map((f, i) => (
                  <div className="viaje-ticket" key={i}>
                    <div className="viaje-ticket-date">{f.date}</div>
                    <div className="viaje-ticket-mid">
                      <div className="viaje-ticket-route">{f.route}</div>
                      <div className="viaje-ticket-air">{f.air}</div>
                    </div>
                    <div className="viaje-ticket-time">
                      {f.dep}→{f.arr}
                      <div style={{ fontSize: "0.6rem", color: "#8a7454" }}>{f.dur}</div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: "0.68rem", color: "#6f5c3c" }}>
                  Reserva vuelos n.º 1598736128015659 · PIN 1278
                </p>

                <div className="viaje-mini-h">Presupuesto</div>
                {BUDGET.map(([k, v], i) => (
                  <div className="viaje-budget-line" key={i}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <div className="viaje-budget-total">
                  <span>Total confirmado (sin hotel Singapur)</span>
                  <b>{BUDGET_TOTAL}</b>
                </div>
                <p style={{ fontSize: "0.66rem", color: "#6f5c3c" }}>
                  No incluye hotel de Singapur (pendiente), comidas, transporte local ni compras.
                </p>
              </div>
            )}

            {tab === "itinerario" && (
              <div>
                {DAYS.map((d) => (
                  <DayCard key={d.n} day={d} />
                ))}
              </div>
            )}

            {tab === "checklist" && (
              <div>
                <div className="viaje-mini-h" style={{ marginTop: 0 }}>Qué llevar en la maleta</div>
                <ChecklistBlock storageKey="viaje-maleta" items={MALETA} />
                <div className="viaje-mini-h">Antes de viajar</div>
                <ChecklistBlock storageKey="viaje-antes" items={ANTES} />
              </div>
            )}

            {tab === "docs" && (
              <div>
                <div className="viaje-mini-h" style={{ marginTop: 0 }}>Pasaporte y vacunas</div>
                <p style={{ fontSize: "0.76rem", color: "#3a2c1a" }}>
                  Pasaporte en regla — validez mínima recomendada: 6 meses desde la entrada en cada país.
                  Certificado internacional de vacunación ya tramitado.
                </p>

                <div className="viaje-mini-h">Entrada a cada país</div>
                <table className="viaje-table">
                  <thead>
                    <tr><th>País</th><th>Visado</th><th>Trámite</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>🇲🇾 Malasia</td><td>Sin visado (90 días)</td><td>MDAC, 72h antes</td></tr>
                    <tr><td>🇸🇬 Singapur</td><td>Sin visado (90 días)</td><td>SG Arrival Card, 72h antes</td></tr>
                    <tr><td>🇮🇩 Indonesia</td><td>Visado/VOA — confirmar</td><td>evisa.imigrasi.go.id</td></tr>
                  </tbody>
                </table>
                <div className="viaje-note">
                  Normativa de Indonesia cambia con frecuencia. Habitualmente Visa on Arrival, ~35 USD
                  (500.000 IDR), 30 días ampliable a 60. Confirmar antes de volar.
                </div>

                <div className="viaje-mini-h">Seguro de viaje</div>
                <p style={{ fontSize: "0.76rem", color: "#3a2c1a" }}>
                  IATI — 248,80 € · póliza 471207825 · viaje 001490604
                </p>

                <div className="viaje-mini-h">Contactos</div>
                {CONTACTS.map((label, i) => (
                  <div className="viaje-contact-row" key={i}>
                    <span>{label}</span>
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={contacts[i] || ""}
                      onChange={(e) => setContact(i, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
