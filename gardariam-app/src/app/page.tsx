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
import type { ImperialMapHandle } from "@/components/map/ImperialMap";
import FlagRoom from "@/components/sections/FlagRoom";
import StatsSection from "@/components/sections/StatsSection";
import Timeline from "@/components/sections/Timeline";
import TopNav from "@/components/TopNav";
import { computeStats } from "@/lib/stats";
import { loadCountriesList, type CountryInfo } from "@/lib/worldData";

const ImperialMap = dynamic(() => import("@/components/map/ImperialMap"), {
  ssr: false,
});

export default function Home() {
  const mapRef = useRef<ImperialMapHandle>(null);
  const [selected, setSelected] = useState<{ iso: string; name: string } | null>(
    null,
  );
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(195);
  const [color, setColor] = useState("#8b1a2a");
  const [paintMode, setPaintMode] = useState(false);
  const [worldVersion, setWorldVersion] = useState(0);
  const [imperialView, setImperialView] = useState(false);
  const [annex, setAnnex] = useState<{ iso: string; name: string; id: number } | null>(
    null,
  );
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const annexIdRef = useRef(0);
  const lastAnnexRef = useRef<{ iso: string; at: number } | null>(null);

  useEffect(() => {
    loadCountriesList().then(setCountries);
  }, []);

  function bumpWorld() {
    setWorldVersion((v) => v + 1);
  }

  function selectCountry(iso: string, name: string) {
    setSelected({ iso, name });
  }

  function handleAnnex(iso: string, name: string) {
    const now = Date.now();
    if (lastAnnexRef.current?.iso === iso && now - lastAnnexRef.current.at < 800) {
      return; // de-dupe rapid repeated firings for the same country
    }
    lastAnnexRef.current = { iso, at: now };
    const id = ++annexIdRef.current;
    setAnnex({ iso, name, id });
    bumpWorld();
    setTimeout(() => {
      setAnnex((cur) => (cur?.id === id ? null : cur));
    }, 3600);
  }

  const stats = computeStats(countries);

  return (
    <>
      <TopNav />
      <Hero />

      <section id="mapa" className="relative h-screen w-full bg-imperial-charcoal">
        <ImperialMap
          ref={mapRef}
          onSelectCountry={selectCountry}
          onAnnex={handleAnnex}
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
        />

        <AnimatePresence>
          {imperialView && <ImperialOverlay stats={stats} />}
        </AnimatePresence>

        <AnimatePresence>
          {paintMode && (
            <BrushToolbar mapRef={mapRef} onExit={() => setPaintMode(false)} />
          )}
        </AnimatePresence>
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
