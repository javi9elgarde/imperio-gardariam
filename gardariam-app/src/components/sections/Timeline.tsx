"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { flagUrl, formatDate } from "@/lib/format";
import { loadProvinceNames } from "@/lib/provinces";
import { computeTimeline } from "@/lib/stats";
import { loadCountriesList, type CountryInfo } from "@/lib/worldData";

export default function Timeline() {
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [provinceNames, setProvinceNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCountriesList().then(setCountries);
    loadProvinceNames().then(setProvinceNames);
  }, []);

  const entries = computeTimeline(countries, provinceNames);

  return (
    <section
      id="cronologia"
      className="relative w-full bg-imperial-charcoal px-6 py-24"
    >
      <div className="mx-auto max-w-2xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-gold-glow font-display mb-14 text-center text-2xl font-bold uppercase tracking-[0.14em] text-imperial-gold-bright sm:text-3xl"
        >
          ⚜ Cronología del Imperio
        </motion.h2>

        {entries.length === 0 ? (
          <p className="text-center text-sm italic text-parchment-faint">
            Aún no hay expediciones registradas. Añade una desde la ficha de cualquier
            territorio en el mapa.
          </p>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-imperial-gold/60 via-imperial-gold/20 to-transparent" />
            {entries.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative mb-8 last:mb-0"
              >
                <span className="absolute -left-8 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-imperial-gold bg-imperial-charcoal shadow-[0_0_8px_rgba(200,144,40,0.5)]" />
                <div className="glass-panel rounded-lg p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-xs font-semibold text-imperial-gold-text">
                      {new Date(`${e.dateFrom}T12:00:00`).getFullYear()}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagUrl(e.iso)} alt={e.name} className="h-4 rounded-sm shadow" />
                    <span className="font-display text-sm font-bold text-parchment">{e.name}</span>
                  </div>
                  {e.region && (
                    <div className="mt-1 text-xs text-parchment-dim">{e.region}</div>
                  )}
                  <div className="mt-1 text-[0.68rem] text-parchment-faint">
                    {formatDate(e.dateFrom)}
                    {e.dateTo ? ` → ${formatDate(e.dateTo)}` : ""}
                  </div>
                  {e.note && (
                    <p className="mt-2 text-[0.76rem] italic leading-relaxed text-parchment-dim">
                      {e.note}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
