"use client";

import { motion } from "framer-motion";
import EmberParticles from "./EmberParticles";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  function scrollToMap() {
    document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-imperial-charcoal px-6 text-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(139,26,42,0.18) 0%, rgba(7,11,23,0) 60%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(200,144,40,0.1) 0%, rgba(7,11,23,0) 70%)",
        }}
      />
      <EmberParticles />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 220px 60px rgba(7,11,23,0.95)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.3, ease: EASE }}
        className="relative z-10"
        style={{
          width: "clamp(180px, 24vw, 260px)",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 0 80px rgba(200,144,40,0.3), 0 0 0 1px rgba(200,144,40,0.4)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/imperio-gardariam/logo.png"
          alt="Imperio Gardariam"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.7, ease: EASE }}
        className="font-display text-gold-glow relative z-10 mt-8 text-4xl font-bold tracking-[0.18em] text-imperial-gold-bright uppercase sm:text-6xl"
      >
        Imperio Gardariam
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="imperial-divider relative z-10 mt-6 w-40 sm:w-56"
      />

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.2, ease: EASE }}
        className="font-display relative z-10 mt-6 max-w-xl text-sm tracking-[0.08em] text-parchment-dim italic sm:text-lg"
      >
        &ldquo;Nuestra historia escrita sobre el mapa del mundo&rdquo;
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.6, ease: EASE }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={scrollToMap}
        className="font-display glass-panel relative z-10 mt-12 cursor-pointer rounded-full px-9 py-3.5 text-xs font-semibold tracking-[0.18em] text-imperial-gold-bright uppercase shadow-[0_0_30px_rgba(200,144,40,0.12)] transition-colors hover:border-imperial-gold hover:bg-imperial-charcoal-3/80"
      >
        Entrar al Imperio
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 1, delay: 2.2 },
          y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 2.2 },
        }}
        className="absolute bottom-8 z-10 text-imperial-gold-dim"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M5 8 L11 14 L17 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </section>
  );
}
