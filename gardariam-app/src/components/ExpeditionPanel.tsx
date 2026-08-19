"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import HighlightsSection from "@/components/panel/HighlightsSection";
import Lightbox from "@/components/panel/Lightbox";
import PhotoUploader from "@/components/panel/PhotoUploader";
import RestaurantsSection from "@/components/panel/RestaurantsSection";
import VideoSection from "@/components/panel/VideoSection";
import { useAuth } from "@/lib/auth";
import { daysBetween, flagUrl, formatDate } from "@/lib/format";
import { playBack } from "@/lib/sound";
import { getCountryData, setCountryData } from "@/lib/storage";
import { buscarVisita, type Restaurant, type Visit } from "@/lib/types";

interface Props {
  iso: string;
  /** nombre del país o provincia al que pertenece */
  countryName: string;
  visitId: string;
  onClose: () => void;
  /** volver a la ficha del país (si se llegó desde ella) */
  onBackToCountry?: () => void;
}

/** Ficha de UNA expedición: sus fotos, su vídeo, sus restaurantes, sus sitios. */
export default function ExpeditionPanel({
  iso,
  countryName,
  visitId,
  onClose,
  onBackToCountry,
}: Props) {
  const { isAdmin } = useAuth();
  const [visits, setVisits] = useState<Visit[]>(() => getCountryData(iso).visits);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    setVisits(getCountryData(iso).visits);
  }, [iso]);

  const idx = buscarVisita(visits, visitId);
  const visita = idx >= 0 ? visits[idx] : null;

  function guardar(patch: Partial<Visit>) {
    if (idx < 0) return;
    const next = visits.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    setVisits(next);
    setCountryData(iso, { visits: next });
  }

  function cerrar() {
    playBack();
    onClose();
  }

  if (!visita) return null;

  const dias =
    visita.dateFrom && visita.dateTo ? daysBetween(visita.dateFrom, visita.dateTo) : null;
  const portada = visita.coverPhoto || visita.photos[0] || "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="country-overlay"
        onClick={cerrar}
      >
        <motion.div
          initial={{ y: 28, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 16, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pergamino-panel country-card"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={cerrar} aria-label="Cerrar" className="pnl-close">
            ✕
          </button>

          {/* Cabecera de la expedición */}
          <header className="exp-hero">
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="exp-hero-img" src={portada} alt="" />
            ) : (
              <div className="exp-hero-vacio" />
            )}
            <div className="exp-hero-velo" />

            {onBackToCountry && (
              <button className="exp-volver" onClick={onBackToCountry}>
                ← {countryName}
              </button>
            )}

            {isAdmin && (
              <div className="exp-hero-subir">
                <PhotoUploader
                  carpeta={`expediciones/${iso}/${visitId}`}
                  etiqueta="Portada"
                  onSubida={(urls) => guardar({ coverPhoto: urls[0] })}
                />
              </div>
            )}

            <div className="exp-hero-txt">
              <span className="exp-migas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl(iso)} alt="" />
                {countryName}
              </span>
              <h2>{visita.region || "Expedición"}</h2>
              <p className="exp-fechas">
                {visita.dateFrom ? formatDate(visita.dateFrom) : "Sin fecha"}
                {visita.dateTo ? ` → ${formatDate(visita.dateTo)}` : ""}
                {dias !== null && dias > 0 && <b> · {dias} días</b>}
              </p>
            </div>
          </header>

          <div className="pergamino-body country-body">
            <div className="country-scroll">
              {visita.note && <p className="exp-nota">{visita.note}</p>}

              <VideoSection
                videoUrl={visita.videoUrl ?? ""}
                editable={isAdmin}
                onChange={(videoUrl) => guardar({ videoUrl })}
              />

              {/* Álbum de esta expedición */}
              <div className="exp-bloque">
                <div className="exp-bloque-cab">
                  <span>📷 Fotos del viaje</span>
                  {isAdmin && (
                    <PhotoUploader
                      carpeta={`expediciones/${iso}/${visitId}`}
                      etiqueta="Añadir fotos"
                      multiple
                      onSubida={(urls) => guardar({ photos: [...visita.photos, ...urls] })}
                    />
                  )}
                </div>
                {visita.photos.length === 0 ? (
                  <p className="exp-vacio">Sin fotos todavía</p>
                ) : (
                  <div className="exp-galeria">
                    {visita.photos.map((src, i) => (
                      <span key={i} className="exp-foto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" onClick={() => setFoto(src)} />
                        {isAdmin && (
                          <button
                            className="exp-foto-x"
                            title="Quitar foto"
                            onClick={() =>
                              guardar({ photos: visita.photos.filter((_, j) => j !== i) })
                            }
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <RestaurantsSection
                restaurants={visita.restaurants ?? []}
                editable={isAdmin}
                onChange={(restaurants: Restaurant[]) => guardar({ restaurants })}
              />
              <HighlightsSection
                highlights={visita.highlights ?? []}
                editable={isAdmin}
                onChange={(highlights: string[]) => guardar({ highlights })}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <Lightbox src={foto} onClose={() => setFoto(null)} />
    </>
  );
}
