"use client";

import { useAuth } from "@/lib/auth";

const LINKS = [
  { id: "mapa", label: "Mapa" },
  { id: "banderas", label: "Banderas" },
  { id: "cronologia", label: "Cronología" },
  { id: "estadisticas", label: "Estadísticas" },
];

export default function TopNav() {
  const { user, isAdmin, loading, signIn, signOutUser } = useAuth();

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Imperio Gardariam" className="h-full w-full object-cover" />
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
      <div className="ml-1 h-5 w-px bg-imperial-gold/25" />
      {!loading && (
        <button
          onClick={() => (user ? signOutUser() : signIn())}
          title={user ? `Sesión: ${user.email}` : "Iniciar sesión"}
          className={`font-display ml-1 rounded-full px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.1em] transition-colors ${
            isAdmin
              ? "bg-imperial-gold/20 text-imperial-gold-bright"
              : "text-parchment-faint hover:bg-imperial-gold/10 hover:text-imperial-gold-bright"
          }`}
        >
          {user ? (isAdmin ? "⚜ Admin" : "Salir") : "Iniciar sesión"}
        </button>
      )}
    </nav>
  );
}
