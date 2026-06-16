"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import HeroPhoto from "@/components/panel/HeroPhoto";
import HighlightsSection from "@/components/panel/HighlightsSection";
import Lightbox from "@/components/panel/Lightbox";
import RestaurantsSection from "@/components/panel/RestaurantsSection";
import VisitsSection from "@/components/panel/VisitsSection";
import { getCountryData, getStatus, setCountryData } from "@/lib/storage";
import type { ConquestStatus, CountryData, Restaurant, Visit } from "@/lib/types";

interface CountryPanelProps {
  iso: string;
  name: string;
  onClose: () => void;
  onSetStatus: (status: ConquestStatus) => void;
  onConquistar: () => void;
  onDataChange?: () => void;
}

const BUTTONS: { status: ConquestStatus; label: string }[] = [
  { status: "none", label: "Sin Conquista" },
  { status: "partial", label: "⚔ Conquistar" },
  { status: "full", label: "⚜ Conquistado" },
];

export default function CountryPanel({
  iso,
  name,
  onClose,
  onSetStatus,
  onConquistar,
  onDataChange,
}: CountryPanelProps) {
  const [status, setStatus] = useState<ConquestStatus>(() => getStatus(iso));
  const [data, setData] = useState<CountryData>(() => getCountryData(iso));
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function persist(next: CountryData) {
    setData(next);
    setCountryData(iso, next);
    onDataChange?.();
  }

  function handleConquestClick(next: ConquestStatus) {
    if (next === "partial") {
      onConquistar();
      return;
    }
    onSetStatus(next);
    setStatus(next);
  }

  return (
    <>
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel fixed inset-y-0 right-0 z-[800] flex w-full max-w-sm flex-col overflow-hidden border-l border-imperial-gold/20"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-imperial-gold/25 bg-imperial-charcoal/70 text-parchment-faint backdrop-blur transition-colors hover:border-imperial-gold hover:text-imperial-gold-bright"
        >
          ✕
        </button>

        <HeroPhoto
          iso={iso}
          name={name}
          coverPhoto={data.coverPhoto}
          onChange={(url) => persist({ ...data, coverPhoto: url })}
        />

        <div className="flex flex-shrink-0 gap-2 px-5 pt-4">
          {BUTTONS.map((b) => (
            <button
              key={b.status}
              onClick={() => handleConquestClick(b.status)}
              className={`font-display flex-1 rounded px-2 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                status === b.status
                  ? "border border-imperial-gold bg-imperial-gold/18 text-imperial-gold-bright"
                  : "border border-white/10 bg-imperial-charcoal-3 text-parchment-faint hover:border-imperial-gold/40"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <VisitsSection
            visits={data.visits}
            onChange={(visits: Visit[]) => persist({ ...data, visits })}
            onPhotoClick={setLightboxSrc}
          />
          <RestaurantsSection
            restaurants={data.restaurants}
            onChange={(restaurants: Restaurant[]) => persist({ ...data, restaurants })}
          />
          <HighlightsSection
            highlights={data.highlights}
            onChange={(highlights: string[]) => persist({ ...data, highlights })}
          />
        </div>
      </motion.aside>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
