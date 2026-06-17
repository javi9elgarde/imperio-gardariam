"use client";

import Image from "next/image";

const LINKS = [
  { id: "mapa", label: "Mapa" },
  { id: "banderas", label: "Banderas" },
  { id: "cronologia", label: "Cronología" },
  { id: "estadisticas", label: "Estadísticas" },
];

export default function TopNav() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav className="glass-panel fixed left-1/2 top-4 z-[900] flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1.5">
      <button
        onClick={() => scrollTo("hero")}
        className="mr-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
        style={{ boxShadow: "0 0 0 1px rgba(200,144,40,0.4)" }}
        aria-label="Inicio"
      >
        <Image src="/logo.png" alt="Imperio Gardariam" width={32} height={32} className="h-full w-full object-cover" />
      </button>
      {LINKS.map((l) => (
        <button
          key={l.id}
          onClick={() => scrollTo(l.id)}
          className="font-display rounded-full px-3.5 py-1.5 text-[0.58rem] uppercase tracking-[0.12em] text-parchment-faint transition-colors hover:bg-imperial-gold/10 hover:text-imperial-gold-bright"
        >
          {l.label}
        </button>
      ))}
    </nav>
  );
}
