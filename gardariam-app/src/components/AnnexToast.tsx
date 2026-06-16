"use client";

import { AnimatePresence, motion } from "framer-motion";
import { flagUrl } from "@/lib/format";

interface AnnexToastProps {
  annex: { iso: string; name: string; id: number } | null;
}

export default function AnnexToast({ annex }: AnnexToastProps) {
  return (
    <AnimatePresence mode="wait">
      {annex && (
        <motion.div
          key={annex.id}
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel fixed left-1/2 top-20 z-[2000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-imperial-gold/40 px-6 py-3 shadow-[0_0_40px_rgba(200,144,40,0.25)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagUrl(annex.iso)} alt={annex.name} className="h-6 rounded shadow" />
          <span className="font-display text-[0.66rem] uppercase tracking-[0.1em] text-imperial-gold-bright">
            <strong>{annex.name}</strong> se ha unido al Imperio Gardariam ⚜
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
