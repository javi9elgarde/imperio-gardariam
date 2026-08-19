"use client";

import { useEffect, useState } from "react";

/**
 * Pantalla de carga con el escudo, igual que en Cocina.
 * Nunca debe quedarse bloqueando la web: se oculta con CSS y se desmonta
 * con temporizadores, sin depender de animaciones (que pueden congelarse).
 */
export default function LoadingScreen() {
  const [saliendo, setSaliendo] = useState(false);
  const [fuera, setFuera] = useState(false);

  useEffect(() => {
    let hecho = false;
    const terminar = () => {
      if (hecho) return;
      hecho = true;
      setSaliendo(true);
      setTimeout(() => setFuera(true), 700); // tras el fundido
    };

    if (document.readyState === "complete") setTimeout(terminar, 350);
    else window.addEventListener("load", terminar, { once: true });

    // tope de seguridad: pase lo que pase, se va
    const tope = setTimeout(terminar, 3500);
    return () => {
      clearTimeout(tope);
      window.removeEventListener("load", terminar);
    };
  }, []);

  if (fuera) return null;

  return (
    <div className={`loading-screen ${saliendo ? "is-out" : ""}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-carga.png" alt="" className="loading-logo" />
      <div className="loading-bar">
        <span />
      </div>
    </div>
  );
}
