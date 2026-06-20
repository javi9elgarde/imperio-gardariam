"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import HeroPhoto from "@/components/panel/HeroPhoto";
import HighlightsSection from "@/components/panel/HighlightsSection";
import Lightbox from "@/components/panel/Lightbox";
import RestaurantsSection from "@/components/panel/RestaurantsSection";
import VideoSection from "@/components/panel/VideoSection";
import VisitsSection from "@/components/panel/VisitsSection";
import { useAuth } from "@/lib/auth";
import { loadProvinceNames } from "@/lib/provinces";
import {
  getCountryData,
  getCountryDataMap,
  getStatus,
  onStorageChange,
  setCountryData,
} from "@/lib/storage";
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
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<ConquestStatus>(() => getStatus(iso));
  const [data, setData] = useState<CountryData>(() => getCountryData(iso));
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [provinceNames, setProvinceNames] = useState<Record<string, string>>({});
  const [provinceVisits, setProvinceVisits] = useState<{ provinceName: string; visit: Visit }[]>([]);

  // Spain's own panel additionally shows (read-only) every province's expeditions —
  // each province still owns and edits its own list independently.
  function refreshProvinceVisits(names: Record<string, string>) {
    if (iso !== "ES") {
      setProvinceVisits([]);
      return;
    }
    const dataMap = getCountryDataMap();
    const merged: { provinceName: string; visit: Visit }[] = [];
    Object.entries(dataMap).forEach(([key, value]) => {
      if (!key.startsWith("ES-")) return;
      value.visits.forEach((visit) => {
        merged.push({ provinceName: names[key] ?? key, visit });
      });
    });
    merged.sort((a, b) => b.visit.dateFrom.localeCompare(a.visit.dateFrom));
    setProvinceVisits(merged);
  }

  useEffect(() => {
    if (iso !== "ES") return;
    loadProvinceNames().then((names) => {
      setProvinceNames(names);
      refreshProvinceVisits(names);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  // Keep this panel's status/data in sync with live painting/Firestore updates —
  // otherwise it stays frozen at whatever it was when the panel first opened.
  useEffect(() => {
    return onStorageChange(() => {
      setStatus(getStatus(iso));
      setData(getCountryData(iso));
      refreshProvinceVisits(provinceNames);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, provinceNames]);

  function persist(patch: Partial<CountryData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setCountryData(iso, patch);
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
          editable={isAdmin}
          onChange={(url) => persist({ coverPhoto: url })}
        />

        {isAdmin ? (
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
        ) : (
          <div className="flex-shrink-0 px-5 pt-4">
            <span
              className={`font-display inline-block rounded px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] ${
                status === "full"
                  ? "border border-imperial-gold bg-imperial-gold/18 text-imperial-gold-bright"
                  : "border border-white/10 bg-imperial-charcoal-3 text-parchment-faint"
              }`}
            >
              {BUTTONS.find((b) => b.status === status)?.label}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <VideoSection
            videoUrl={data.videoUrl}
            editable={isAdmin}
            onChange={(videoUrl: string) => persist({ videoUrl })}
          />
          <VisitsSection
            visits={data.visits}
            editable={isAdmin}
            onChange={(visits: Visit[]) => persist({ visits })}
            onPhotoClick={setLightboxSrc}
            provinceVisits={provinceVisits}
          />
          <RestaurantsSection
            restaurants={data.restaurants}
            editable={isAdmin}
            onChange={(restaurants: Restaurant[]) => persist({ restaurants })}
          />
          <HighlightsSection
            highlights={data.highlights}
            editable={isAdmin}
            onChange={(highlights: string[]) => persist({ highlights })}
          />
        </div>
      </motion.aside>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
