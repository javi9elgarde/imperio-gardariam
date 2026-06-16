"use client";

import { motion } from "framer-motion";
import type { ImperialStats } from "@/lib/stats";

interface ImperialOverlayProps {
  stats: ImperialStats;
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-6 text-[0.66rem]">
      <span className="text-parchment-faint">{label}</span>
      <span className="font-display font-bold text-parchment">{value}</span>
    </div>
  );
}

export default function ImperialOverlay({ stats }: ImperialOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.4 }}
      className="glass-panel absolute left-4 top-20 z-[500] flex w-56 flex-col gap-2.5 rounded-xl border border-imperial-gold/30 px-5 py-4"
    >
      <div className="font-display mb-1 text-[0.62rem] uppercase tracking-[0.18em] text-imperial-gold-bright">
        ⚜ Vista Imperial
      </div>
      <Row label="Territorios" value={`${stats.conqueredCount} / ${stats.totalCount}`} />
      <Row label="Continentes" value={`${stats.continentsExplored} / ${stats.continentsTotal}`} />
      <Row label="Expediciones" value={stats.totalVisits} />
      <Row label="Banderas obtenidas" value={stats.conqueredCount} />
    </motion.div>
  );
}
