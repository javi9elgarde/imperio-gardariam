"use client";

import { useState } from "react";
import PhotoUploader from "@/components/panel/PhotoUploader";
import { flagUrl } from "@/lib/format";

interface HeroPhotoProps {
  iso: string;
  name: string;
  coverPhoto: string;
  editable: boolean;
  onChange: (url: string) => void;
}

export default function HeroPhoto({ iso, name, coverPhoto, editable, onChange }: HeroPhotoProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(coverPhoto);

  return (
    <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden bg-imperial-charcoal-2">
      {coverPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverPhoto} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-imperial-charcoal-2 to-imperial-charcoal-3" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-imperial-charcoal via-imperial-charcoal/10 to-transparent" />

      {editable && (
        <div className="hero-acciones">
          <PhotoUploader
            carpeta={`paises/${iso}`}
            etiqueta="Subir portada"
            onSubida={(urls) => onChange(urls[0])}
          />
          <button
            onClick={() => {
              setDraft(coverPhoto);
              setEditing((e) => !e);
            }}
            className="hero-url-btn"
            title="Pegar una dirección de internet en vez de subir un archivo"
          >
            🔗 URL
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-4 right-16 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagUrl(iso)} alt={name} className="h-6 rounded shadow-lg" />
        <h2 className="text-gold-glow font-display text-lg font-bold text-parchment">{name}</h2>
      </div>

      {editing && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-imperial-charcoal-3 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://imagen.com/foto.jpg"
            className="flex-1 rounded border border-imperial-gold/25 bg-imperial-charcoal-2 px-2.5 py-1.5 text-xs text-parchment outline-none focus:border-imperial-gold"
          />
          <button
            onClick={() => {
              onChange(draft);
              setEditing(false);
            }}
            className="font-display rounded bg-imperial-gold/20 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.1em] text-imperial-gold-bright"
          >
            Aplicar
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded border border-white/10 px-2 py-1.5 text-parchment-faint"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
