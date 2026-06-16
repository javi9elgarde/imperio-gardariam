"use client";

import { motion } from "framer-motion";

// Hand-tuned positions (not random) so server/client markup always matches.
const PARTICLES = [
  { left: "6%", size: 3, delay: 0, duration: 9 },
  { left: "13%", size: 2, delay: 1.4, duration: 11 },
  { left: "21%", size: 4, delay: 0.6, duration: 8 },
  { left: "29%", size: 2, delay: 2.1, duration: 12 },
  { left: "37%", size: 3, delay: 0.2, duration: 10 },
  { left: "44%", size: 2, delay: 1.8, duration: 9 },
  { left: "52%", size: 4, delay: 0.9, duration: 11 },
  { left: "59%", size: 2, delay: 2.6, duration: 8 },
  { left: "67%", size: 3, delay: 0.4, duration: 10 },
  { left: "74%", size: 2, delay: 1.2, duration: 12 },
  { left: "82%", size: 4, delay: 1.9, duration: 9 },
  { left: "89%", size: 2, delay: 0.7, duration: 11 },
  { left: "94%", size: 3, delay: 2.3, duration: 10 },
  { left: "17%", size: 2, delay: 3.1, duration: 13 },
  { left: "47%", size: 2, delay: 3.6, duration: 9 },
  { left: "78%", size: 3, delay: 2.9, duration: 12 },
] as const;

export default function EmberParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-4%",
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle, rgba(240,197,66,0.95) 0%, rgba(200,144,40,0.4) 60%, transparent 100%)",
          }}
          animate={{
            y: ["0%", "-115vh"],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
