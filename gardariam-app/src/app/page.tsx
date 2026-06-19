"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import AnnexToast from "@/components/AnnexToast";
import BrushToolbar from "@/components/BrushToolbar";
import CountryPanel from "@/components/CountryPanel";
import Hero from "@/components/Hero";
import HudBar from "@/components/HudBar";
import ImperialOverlay from "@/components/ImperialOverlay";
import type { HoverData, ImperialMapHandle } from "@/components/map/ImperialMap";
import MapIconBar from "@/components/MapIconBar";
import FlagRoom from "@/components/sections/FlagRoom";
import StatsSection from "@/components/sections/StatsSection";
import Timeline from "@/components/sections/Timeline";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/lib/auth";
import { computeStats } from "@/lib/stats";
import { onStorageChange } from "@/lib/storage";
import { loadCountriesList, type CountryInfo } from "@/lib/worldData";
import { flagUrl } from "@/lib/format";

const ImperialMap = dynamic(() => import("@/components/map/ImperialMap"), {
  ssr: false,
});

const STATUS_LABEL: Record<string, string> = {
  full: "⚜ Conquistado",
  partial: "⚔ Invadiendo",
  none: "Sin conquistar",
};
const STATUS_CLASS: Record<string, string> = {
  full: "ct-full",
  partial: "ct-partial",
  none: "ct-none",
};

export default function Home() {
  const { isAdmin } = useAuth();
  const mapRef = useRef<ImperialMapHandle>(null);
  const [selected, setSelected] = useState<{ iso: string; name: string } | null>(null);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(195);
  const [color, setColor] = useState("#8b1a2a");
  const [paintMode, setPaintMode] = useState(false);
  const [worldVersion, setWorldVersion] = useState(0);
  const [imperialView, setImperialView] = useState(false);
  const [annex, setAnnex] = useState<{ iso: string; name: string; id: number } | null>(null);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [iconBarOpen, setIconBarOpen] = useState(false);
  const [activeIcon, setActiveIcon] = useState<string | null>(null);
  const annexIdRef = useRef(0);
  const lastAnnexRef = useRef<{ iso: string; at: number } | null>(null);

  useEffect(() => {
    loadCountriesList().then(setCountries);
  }, []);

  useEffect(() => {
    return onStorageChange(() => {
      bumpWorld();
      mapRef.current?.redraw();
    });
  }, []);

  function bumpWorld() {
    setWorldVersion((v) => v + 1);
  }

  function selectCountry(iso: string, name: string) {
    // Don't open panel when placing icons
    if (activeIcon) return;
    setSelected({ iso, name });
  }

  function handleAnnex(iso: string, name: string) {
    const now = Date.now();
    if (lastAnnexRef.current?.iso === iso && now - lastAnnexRef.current.at < 800) return;
    lastAnnexRef.current = { iso, at: now };
    const id = ++annexIdRef.current;
    setAnnex({ iso, name, id });
    bumpWorld();
    setTimeout(() => {
      setAnnex((cur) => (cur?.id === id ? null : cur));
    }, 3600);
  }

  function handleSelectIcon(type: string | null) {
    setActiveIcon(type);
    mapRef.current?.setIconMode(type);
  }

  function handleCloseIconBar() {
    setIconBarOpen(false);
    setActiveIcon(null);
    mapRef.current?.setIconMode(null);
  }

  const stats = computeStats(countries);

  // Tooltip flag: strip province part for Spain
  const tooltipIso = hoverData?.iso.includes("-") ? hoverData.iso.split("-")[0] : hoverData?.iso;

  return (
    <>
      <TopNav />
      <Hero />

      <section id="mapa" className="relative h-screen w-full bg-imperial-charcoal">
        <ImperialMap
          ref={mapRef}
          onSelectCountry={selectCountry}
          onAnnex={handleAnnex}
          onHover={setHoverData}
          onConqueredCountChange={(n) => {
            setCount(n);
            bumpWorld();
          }}
          onWorldLoaded={(t) => {
            setTotal(t);
            setColor(mapRef.current?.getColor() ?? "#8b1a2a");
          }}
        />

        <HudBar
          count={count}
          total={total}
          color={color}
          onColorChange={(hex) => {
            setColor(hex);
            mapRef.current?.setColor(hex);
          }}
          imperialView={imperialView}
          onToggleImperialView={() => {
            const active = mapRef.current?.toggleImperialView() ?? false;
            setImperialView(active);
          }}
          iconBarOpen={iconBarOpen}
          onToggleIconBar={() => {
            const next = !iconBarOpen;
            setIconBarOpen(next);
            if (!next) {
              setActiveIcon(null);
              mapRef.current?.setIconMode(null);
            }
          }}
          isAdmin={isAdmin}
        />

        <AnimatePresence>
          {imperialView && <ImperialOverlay stats={stats} />}
        </AnimatePresence>

        <AnimatePresence>
          {paintMode && (
            <BrushToolbar mapRef={mapRef} onExit={() => setPaintMode(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {iconBarOpen && (
            <MapIconBar
              activeIcon={activeIcon}
              onSelectIcon={handleSelectIcon}
              onClose={handleCloseIconBar}
            />
          )}
        </AnimatePresence>

        {/* Country hover tooltip — rendered fixed above all map layers */}
        {hoverData && !paintMode && (
          <div
            className="hover-tooltip-react"
            style={{ left: hoverData.x, top: hoverData.y - 88 }}
          >
            <div className="ct-header">
              <img
                className="ct-flag"
                src={flagUrl(hoverData.iso)}
                alt={tooltipIso}
              />
              <span className="ct-name">{hoverData.name}</span>
            </div>
            <span className={`ct-badge ${STATUS_CLASS[hoverData.status] ?? "ct-none"}`}>
              {STATUS_LABEL[hoverData.status] ?? "Sin conquistar"}
            </span>
          </div>
        )}
      </section>

      <FlagRoom worldVersion={worldVersion} onSelectCountry={selectCountry} />
      <Timeline />
      <StatsSection />

      <AnnexToast annex={annex} />

      <AnimatePresence>
        {selected && (
          <CountryPanel
            key={selected.iso}
            iso={selected.iso}
            name={selected.name}
            onClose={() => setSelected(null)}
            onDataChange={bumpWorld}
            onSetStatus={(status) =>
              mapRef.current?.setCountryStatus(selected.iso, status)
            }
            onConquistar={() => {
              document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth" });
              mapRef.current?.enterPaintMode(selected.iso);
              setPaintMode(true);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
