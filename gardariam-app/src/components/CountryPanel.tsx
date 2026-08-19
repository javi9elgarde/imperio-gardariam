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
import { playBack } from "@/lib/sound";
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

  function cerrar() {
    playBack();
    onClose();
  }

  return (
    <>
      {/* Ficha centrada, como la de una receta en Cocina */}
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

        <HeroPhoto
          iso={iso}
          name={name}
          coverPhoto={data.coverPhoto}
          editable={isAdmin}
          onChange={(url) => persist({ coverPhoto: url })}
        />

        <div className="pergamino-body country-body">
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

        <div className="country-scroll">
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
        </div>
      </motion.div>
      </motion.div>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
