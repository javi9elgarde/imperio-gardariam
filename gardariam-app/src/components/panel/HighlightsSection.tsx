"use client";

import { useState } from "react";

interface HighlightsSectionProps {
  highlights: string[];
  editable: boolean;
  onChange: (highlights: string[]) => void;
}

export default function HighlightsSection({ highlights, editable, onChange }: HighlightsSectionProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function save() {
    const text = draft.trim();
    if (!text) return;
    onChange([text, ...highlights]);
    setDraft("");
    setAdding(false);
  }
  function remove(i: number) {
    onChange(highlights.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center justify-between border-b border-imperial-gold/20 pb-2">
        <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-parchment-faint">
          ⚜ Lugares Destacados
        </span>
        {editable && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="font-display rounded-full border border-imperial-gold/25 bg-imperial-gold/8 px-3 py-1 text-[0.56rem] uppercase tracking-[0.1em] text-imperial-gold-bright transition-colors hover:bg-imperial-gold/18"
          >
            + Añadir
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {adding && (
          <div className="rounded-lg border border-imperial-gold/25 bg-imperial-charcoal-3 p-3.5">
            <label className="font-display mb-1 block text-[0.56rem] uppercase tracking-[0.12em] text-parchment-faint">
              Lugar o momento destacado
            </label>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Sagrada Família, atardecer en..."
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
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                className="font-display rounded border border-white/10 px-3 py-2 text-[0.6rem] uppercase tracking-[0.1em] text-parchment-faint"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {highlights.length === 0 && !adding && (
          <p className="py-4 text-center text-xs italic text-parchment-faint">
            Sin lugares añadidos aún
          </p>
        )}

        {highlights.map((h, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded border border-white/10 bg-imperial-charcoal-2 px-3 py-2"
          >
            <span className="flex-shrink-0 text-[0.7rem] text-imperial-gold">⚔</span>
            <span className="flex-1 text-[0.78rem] text-parchment-dim">{h}</span>
            {editable && (
              <button
                onClick={() => remove(i)}
                className="flex-shrink-0 px-1 text-[0.75rem] text-parchment-faint transition-colors hover:text-red-300"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
