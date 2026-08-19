"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { daysBetween, flagUrl, formatDate } from "@/lib/format";
import { loadProvinceNames } from "@/lib/provinces";
import { playEnter } from "@/lib/sound";
import { computeTimeline } from "@/lib/stats";
import { onStorageChange } from "@/lib/storage";
import { loadCountriesList, type CountryInfo } from "@/lib/worldData";

interface TimelineProps {
  /** abre la ficha de esa expedición */
  onOpenExpedition: (iso: string, name: string, visitId: string) => void;
}

export default function Timeline({ onOpenExpedition }: TimelineProps) {
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [provinceNames, setProvinceNames] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    loadCountriesList().then(setCountries);
    loadProvinceNames().then(setProvinceNames);
  }, []);

  useEffect(() => onStorageChange(() => setVersion((v) => v + 1)), []);

  const entries = computeTimeline(countries, provinceNames);
  void version; // se recalcula cuando cambian los datos

  /* Se agrupa por año para que se lea como una línea del tiempo de verdad */
  const porAnio: { anio: number; items: typeof entries }[] = [];
  for (const e of entries) {
    const anio = new Date(`${e.dateFrom}T12:00:00`).getFullYear();
    const ultimo = porAnio[porAnio.length - 1];
    if (ultimo && ultimo.anio === anio) ultimo.items.push(e);
    else porAnio.push({ anio, items: [e] });
  }

  return (
    <section id="cronologia" className="crono-section">
      <div className="crono-inner">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="crono-titulo"
        >
          ⚜ Cronología del Imperio
        </motion.h2>
        <p className="crono-sub">De lo más reciente a lo más antiguo</p>

        {entries.length === 0 ? (
          <p className="crono-vacio">
            Aún no hay expediciones registradas. Añade una desde la ficha de cualquier
            territorio del mapa.
          </p>
        ) : (
          <div className="crono-linea">
            {porAnio.map((grupo) => (
              <div key={grupo.anio} className="crono-anio">
                <div className="crono-anio-cab">
                  <span>{grupo.anio}</span>
                  <i>
                    {grupo.items.length} {grupo.items.length === 1 ? "expedición" : "expediciones"}
                  </i>
                </div>

                {grupo.items.map((e) => {
                  const dias = e.dateFrom && e.dateTo ? daysBetween(e.dateFrom, e.dateTo) : null;
                  return (
                    <motion.button
                      key={`${e.iso}-${e.visitId}`}
                      type="button"
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="crono-card"
                      onClick={() => {
                        playEnter();
                        onOpenExpedition(e.iso, e.name, e.visitId);
                      }}
                    >
                      <span className="crono-punto" aria-hidden />

                      {e.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="crono-foto" src={e.photo} alt="" />
                      ) : (
                        <span className="crono-foto crono-foto-vacia" aria-hidden>
                          ⚔
                        </span>
                      )}

                      <span className="crono-txt">
                        <span className="crono-pais">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flagUrl(e.iso)} alt="" />
                          {e.name}
                        </span>
                        <b className="crono-nombre">{e.region || "Expedición"}</b>
                        <span className="crono-fechas">
                          {formatDate(e.dateFrom)}
                          {e.dateTo ? ` → ${formatDate(e.dateTo)}` : ""}
                          {dias !== null && dias > 0 ? ` · ${dias} días` : ""}
                        </span>
                        {e.note && <span className="crono-nota">{e.note}</span>}
                      </span>

                      <span className="crono-ir" aria-hidden>
                        {e.hasVideo && <i title="Tiene vídeo">🎬</i>}›
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
