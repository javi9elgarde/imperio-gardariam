"use client";

import { motion } from "framer-motion";

const ICONS = [
  { type: "battle",   emoji: "⚔",  label: "Batalla" },
  { type: "next",     emoji: "🏴",  label: "Próxima" },
  { type: "interest", emoji: "⭐",  label: "Interés" },
  { type: "danger",   emoji: "💀",  label: "Peligro" },
  { type: "explore",  emoji: "🔭",  label: "Explorar" },
  { type: "alliance", emoji: "🤝",  label: "Alianza" },
] as const;

interface MapIconBarProps {
  activeIcon: string | null;
  onSelectIcon: (type: string | null) => void;
  onClose: () => void;
}

export default function MapIconBar({ activeIcon, onSelectIcon, onClose }: MapIconBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel absolute bottom-20 left-1/2 z-[490] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-4 py-2.5"
    >
        <span className="font-display mr-1 text-[0.55rem] uppercase tracking-[0.14em] text-parchment-faint">
          Colocar:
        </span>

        {ICONS.map(({ type, emoji, label }) => (
          <button
            key={type}
            title={label}
            onClick={() => onSelectIcon(activeIcon === type ? null : type)}
            className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-all ${
              activeIcon === type
                ? "bg-imperial-gold/20 ring-1 ring-imperial-gold/60"
                : "hover:bg-white/5"
            }`}
          >
            <span
              className={`map-icon-inner icon-${type}-preview text-xl`}
              style={{
                display: "flex",
                fontSize: "20px",
                filter:
                  activeIcon === type
                    ? "drop-shadow(0 0 6px rgba(240,197,66,0.8))"
                    : "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
              }}
            >
              {emoji}
            </span>
            <span className="font-display text-[0.48rem] uppercase tracking-[0.1em] text-parchment-faint">
              {label}
            </span>
            {activeIcon === type && (
              <motion.div
                layoutId="icon-active"
                className="absolute inset-0 rounded-xl bg-imperial-gold/10"
              />
            )}
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-imperial-gold/20" />

        <button
          onClick={onClose}
          title="Cerrar"
          className="text-parchment-faint transition-colors hover:text-imperial-gold-bright"
        >
          ✕
        </button>
    </motion.div>
  );
}
