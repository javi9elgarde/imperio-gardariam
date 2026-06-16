"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { RefObject } from "react";
import type { ImperialMapHandle } from "./map/ImperialMap";

interface BrushToolbarProps {
  mapRef: RefObject<ImperialMapHandle | null>;
  onExit: () => void;
}

const SIZES = [7, 13, 21];

export default function BrushToolbar({ mapRef, onExit }: BrushToolbarProps) {
  const [active, setActive] = useState(1);
  const [erasing, setErasing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35 }}
      className="glass-panel absolute bottom-24 left-1/2 z-[550] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2"
    >
      <span className="font-display text-[0.56rem] uppercase tracking-[0.18em] text-parchment-faint">
        Pincel
      </span>
      <div className="flex items-center gap-1.5">
        {SIZES.map((sz, i) => (
          <button
            key={i}
            onClick={() => {
              mapRef.current?.setBrushSize(i);
              setActive(i);
              setErasing(false);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              active === i && !erasing
                ? "border-imperial-gold bg-imperial-gold/15"
                : "border-white/10 bg-imperial-charcoal-3"
            }`}
          >
            <span
              className="rounded-full bg-imperial-gold-bright"
              style={{ width: sz / 2.6, height: sz / 2.6 }}
            />
          </button>
        ))}
      </div>
      <div className="h-5 w-px bg-imperial-gold/30" />
      <button
        onClick={() => {
          const e = mapRef.current?.toggleEraseMode();
          setErasing(!!e);
        }}
        className={`font-display rounded-full border px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.1em] transition-colors ${
          erasing
            ? "border-red-400/60 bg-red-400/10 text-red-300"
            : "border-white/10 text-parchment-faint"
        }`}
      >
        ⊖ Borrar
      </button>
      <div className="h-5 w-px bg-imperial-gold/30" />
      <button
        onClick={() => {
          mapRef.current?.exitPaintMode();
          onExit();
        }}
        className="font-display rounded-full border border-imperial-gold/25 bg-imperial-gold/10 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.1em] text-imperial-gold-bright transition-colors hover:bg-imperial-gold/20"
      >
        ✕ Salir
      </button>
    </motion.div>
  );
}
