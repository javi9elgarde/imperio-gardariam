"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import BackToRoom from "@/components/BackToRoom";
import ConquestRoom, { type RoomTarget } from "@/components/ConquestRoom";
import LoadingScreen from "@/components/LoadingScreen";
import CountryPanel from "@/components/CountryPanel";
import MapZone from "@/components/region/MapZone";
import FlagRoom from "@/components/sections/FlagRoom";
import StatsSection from "@/components/sections/StatsSection";
import Timeline from "@/components/sections/Timeline";
import { useAuth } from "@/lib/auth";
import { onStorageChange, setStatus } from "@/lib/storage";
import type { ConquestStatus } from "@/lib/types";

type View = "sala" | "mapa" | "banderas" | "cronologia" | "estadisticas";

export default function Home() {
  const { isAdmin, user, loading, signIn, signOutUser } = useAuth();
  const [view, setView] = useState<View>("sala");
  const [selected, setSelected] = useState<{ iso: string; name: string } | null>(null);
  const [worldVersion, setWorldVersion] = useState(0);

  useEffect(() => onStorageChange(() => bumpWorld()), []);

  function bumpWorld() {
    setWorldVersion((v) => v + 1);
  }

  function selectCountry(iso: string, name: string) {
    setSelected({ iso, name });
  }

  function navigate(target: RoomTarget) {
    if (target === "hub") {
      window.location.href = "https://gardariam.com";
      return;
    }
    setView(target);
  }

  function backToRoom() {
    setSelected(null);
    setView("sala");
  }

  return (
    <div className="viajes-app">
      <LoadingScreen />
      {/* ===== Sala (portada, fija) ===== */}
      <div className={`view-layer ${view === "sala" ? "active" : ""}`}>
        <ConquestRoom onNavigate={navigate} />
        {!loading && (
          <button
            onClick={() => (user ? signOutUser() : signIn())}
            title={user ? `Sesión: ${user.email}` : "Iniciar sesión"}
            className="admin-corner"
          >
            {user ? (isAdmin ? "⚜ Admin" : "Salir") : "Iniciar sesión"}
          </button>
        )}
      </div>

      {/* ===== Zona: Mapa ===== */}
      <div className={`view-layer ${view === "mapa" ? "active" : ""}`}>
        <MapZone onSelectCountry={selectCountry} onBackToRoom={backToRoom} />
      </div>

      {/* ===== Zona: Banderas ===== */}
      <div className={`view-layer ${view === "banderas" ? "active" : ""}`}>
        <FlagRoom worldVersion={worldVersion} onSelectCountry={selectCountry} />
        <BackToRoom onClick={backToRoom} />
      </div>

      {/* ===== Zona: Cronología ===== */}
      <div className={`view-layer ${view === "cronologia" ? "active" : ""}`}>
        <Timeline />
        <BackToRoom onClick={backToRoom} />
      </div>

      {/* ===== Zona: Estadísticas ===== */}
      <div className={`view-layer ${view === "estadisticas" ? "active" : ""}`}>
        <StatsSection />
        <BackToRoom onClick={backToRoom} />
      </div>

      <AnimatePresence>
        {selected && (
          <CountryPanel
            key={selected.iso}
            iso={selected.iso}
            name={selected.name}
            onClose={() => setSelected(null)}
            onDataChange={bumpWorld}
            onSetStatus={(status: ConquestStatus) => setStatus(selected.iso, status)}
            onConquistar={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
