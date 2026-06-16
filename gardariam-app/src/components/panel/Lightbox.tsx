"use client";

import { AnimatePresence, motion } from "framer-motion";

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

export default function Lightbox({ src, onClose }: LightboxProps) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[4000] flex items-center justify-center bg-imperial-charcoal/97 p-6"
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-imperial-gold/30 bg-imperial-charcoal-2 text-parchment-dim transition-colors hover:border-imperial-gold hover:text-imperial-gold-bright"
          >
            ✕
          </button>
          <motion.img
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            src={src}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] rounded object-contain shadow-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
