"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { isSoundMuted, setSoundMuted } from "@/lib/sound";

interface HudBarProps {
  count: number;
  total: number;
  color: string;
  onColorChange: (hex: string) => void;
  onResetView: () => void;
  iconBarOpen: boolean;
  onToggleIconBar: () => void;
  isAdmin: boolean;
}

export default function HudBar({
  count,
  total,
  color,
  onColorChange,
  onResetView,
  iconBarOpen,
  onToggleIconBar,
  isAdmin,
}: HudBarProps) {
  const [muted, setMuted] = useState(() => isSoundMuted());

  return (
    <div className="glass-panel absolute bottom-6 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-2.5">
      <span className="text-imperial-gold-bright">⚜</span>
      <span className="font-display text-[0.64rem] uppercase tracking-[0.12em] text-parchment-dim">
        <motion.strong
          key={count}
          initial={{ scale: 1.6 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block text-imperial-gold-bright"
        >
          {count}
        </motion.strong>{" "}
        / {total} territorios conquistados
      </span>
      {isAdmin && (
        <>
          <div className="h-5 w-px bg-imperial-gold/25" />
          <label
            className="relative h-6 w-6 cursor-pointer rounded-full border-2"
            style={{ background: color, borderColor: "var(--color-imperial-gold)" }}
            title="Color de conquista"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </>
      )}
      <div className="h-5 w-px bg-imperial-gold/25" />
      <button
        onClick={() => {
          const v = !muted;
          setMuted(v);
          setSoundMuted(v);
        }}
        title={muted ? "Activar sonido" : "Silenciar"}
        className="text-parchment-faint transition-colors hover:text-imperial-gold-bright"
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <button
        onClick={onResetView}
        title="Restablecer vista"
        className="font-display rounded-full border border-white/10 px-3 py-1 text-[0.56rem] uppercase tracking-[0.1em] text-parchment-faint transition-colors hover:border-imperial-gold/40 hover:text-imperial-gold-bright"
      >
        ↺ Restablecer vista
      </button>
      {isAdmin && (
        <button
          onClick={onToggleIconBar}
          title="Iconos en el mapa"
          className={`font-display rounded-full border px-3 py-1 text-[0.56rem] uppercase tracking-[0.1em] transition-colors ${
            iconBarOpen
              ? "border-imperial-gold bg-imperial-gold/20 text-imperial-gold-bright"
              : "border-white/10 text-parchment-faint hover:border-imperial-gold/40"
          }`}
        >
          ✦ Iconos
        </button>
      )}
    </div>
  );
}
