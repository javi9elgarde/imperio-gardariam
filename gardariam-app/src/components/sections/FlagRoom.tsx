"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { flagUrl } from "@/lib/format";
import { getStatus } from "@/lib/storage";
import { loadCountriesList, type CountryInfo } from "@/lib/worldData";

interface FlagRoomProps {
  worldVersion: number;
  onSelectCountry: (iso: string, name: string) => void;
}

export default function FlagRoom({ onSelectCountry }: FlagRoomProps) {
  const [countries, setCountries] = useState<CountryInfo[]>([]);

  useEffect(() => {
    loadCountriesList().then(setCountries);
  }, []);

  const conqueredCount = countries.filter((c) => getStatus(c.iso) !== "none").length;

  return (
    <section
      id="banderas"
      className="relative w-full bg-imperial-charcoal-2 px-6 py-24"
    >
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-gold-glow font-display mb-2 text-center text-2xl font-bold uppercase tracking-[0.14em] text-imperial-gold-bright sm:text-3xl"
        >
          ⚔ Sala de Banderas
        </motion.h2>
        <p className="mb-10 text-center text-[0.7rem] uppercase tracking-[0.22em] text-parchment-faint">
          {conqueredCount} / {countries.length} conquistados
        </p>

        {countries.length > 0 && (
          <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {countries.map((c, i) => {
              const visited = getStatus(c.iso) !== "none";
              return (
                <motion.button
                  key={c.iso}
                  onClick={() => onSelectCountry(c.iso, c.name)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.004, 0.4) }}
                  whileHover={visited ? { scale: 1.14, y: -3 } : { scale: 1.03 }}
                  className={`flag-tip relative flex flex-col items-center justify-center rounded-md border p-1.5 transition-colors ${
                    visited
                      ? "border-imperial-gold/35 bg-imperial-gold/5 shadow-[0_0_10px_rgba(200,144,40,0.15)]"
                      : "border-white/5 bg-imperial-charcoal-3"
                  }`}
                  data-tip={c.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagUrl(c.iso)}
                    alt={c.name}
                    loading="lazy"
                    className={`h-6 w-9 rounded-sm object-cover transition-all ${
                      visited ? "" : "opacity-25 grayscale"
                    }`}
                  />
                  {visited && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-imperial-gold-bright shadow-[0_0_6px_rgba(240,197,66,0.85)]" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {countries.length === 0 && (
          <p className="text-center text-xs text-parchment-faint">Cargando territorios…</p>
        )}
      </div>
    </section>
  );
}
