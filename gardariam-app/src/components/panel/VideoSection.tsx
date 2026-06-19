"use client";

import { useState } from "react";
import { youtubeId } from "@/lib/format";

interface VideoSectionProps {
  videoUrl: string;
  editable: boolean;
  onChange: (videoUrl: string) => void;
}

export default function VideoSection({ videoUrl, editable, onChange }: VideoSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(videoUrl);

  const id = youtubeId(videoUrl);

  function save() {
    onChange(draft.trim());
    setEditing(false);
  }

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center justify-between border-b border-imperial-gold/20 pb-2">
        <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-parchment-faint">
          🎬 Video del Viaje
        </span>
        {editable && !editing && (
          <button
            onClick={() => {
              setDraft(videoUrl);
              setEditing(true);
            }}
            className="font-display rounded-full border border-imperial-gold/25 bg-imperial-gold/8 px-3 py-1 text-[0.56rem] uppercase tracking-[0.1em] text-imperial-gold-bright transition-colors hover:bg-imperial-gold/18"
          >
            {videoUrl ? "Editar" : "+ Añadir"}
          </button>
        )}
      </div>

      {editing && (
        <div className="rounded-lg border border-imperial-gold/25 bg-imperial-charcoal-3 p-3.5">
          <label className="font-display mb-1 block text-[0.56rem] uppercase tracking-[0.12em] text-parchment-faint">
            URL de YouTube
          </label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mb-3 w-full rounded border border-white/10 bg-imperial-charcoal-2 px-2.5 py-1.5 text-sm text-parchment outline-none focus:border-imperial-gold"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="font-display flex-1 rounded bg-imperial-gold/18 py-2 text-[0.6rem] uppercase tracking-[0.1em] text-imperial-gold-bright"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="font-display rounded border border-white/10 px-3 py-2 text-[0.6rem] uppercase tracking-[0.1em] text-parchment-faint"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!editing && id && (
        <div className="overflow-hidden rounded-lg border border-white/10" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            title="Video del viaje"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {!editing && !id && (
        <p className="py-4 text-center text-xs italic text-parchment-faint">
          Sin video añadido aún
        </p>
      )}
    </div>
  );
}
