"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { computeStats } from "@/lib/stats";
import { loadCountriesList, type CountryInfo } from "@/lib/worldData";

function DonutStat({ value, total, label }: { value: number; total: number; label: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const offset = c * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg viewBox="0 0 130 130" className="absolute inset-0 -rotate-90">
          <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
          <motion.circle
            cx="65"
            cy="65"
            r={r}
            fill="none"
            stroke="url(#donut-gradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="donut-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f0c542" />
              <stop offset="100%" stopColor="#8b1a2a" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col items-center">
          <span className="font-display text-3xl font-bold text-imperial-gold-bright">{value}</span>
          <span className="text-[0.6rem] text-parchment-faint">/ {total}</span>
        </div>
      </div>
      <span className="font-display text-center text-[0.64rem] uppercase tracking-[0.16em] text-parchment-dim">
        {label}
      </span>
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-lg p-5 text-center"
    >
      <div className="font-display text-2xl font-bold text-imperial-gold-bright">{value}</div>
      <div className="mt-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-parchment-faint">
        {label}
      </div>
    </motion.div>
  );
}

export default function StatsSection() {
  const [countries, setCountries] = useState<CountryInfo[]>([]);

  useEffect(() => {
    loadCountriesList().then(setCountries);
  }, []);

  const stats = computeStats(countries);

  return (
    <section
      id="estadisticas"
      className="relative w-full bg-imperial-charcoal-2 px-6 py-24"
    >
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-gold-glow font-display mb-14 text-center text-2xl font-bold uppercase tracking-[0.14em] text-imperial-gold-bright sm:text-3xl"
        >
          ⚔ Estadísticas del Imperio
        </motion.h2>

        <div className="mb-12 flex justify-center">
          <DonutStat
            value={stats.conqueredCount}
            total={stats.totalCount}
            label="Territorios Conquistados"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard value={`${stats.continentsExplored} / ${stats.continentsTotal}`} label="Continentes Explorados" />
          <StatCard value={stats.totalVisits} label="Expediciones" />
          <StatCard value={stats.totalDays} label="Días de Aventura" />
          <StatCard value={stats.totalRestaurants} label="Restaurantes Probados" />
          <StatCard
            value={stats.mostVisitedCountry ? stats.mostVisitedCountry.name : "—"}
            label="País Más Visitado"
          />
          <StatCard value={stats.busiestYear ? stats.busiestYear.year : "—"} label="Año Con Más Viajes" />
        </div>
      </div>
    </section>
  );
}
