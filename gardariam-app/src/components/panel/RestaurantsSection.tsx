"use client";

import { useState } from "react";
import { stars } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

interface RestaurantsSectionProps {
  restaurants: Restaurant[];
  editable: boolean;
  onChange: (restaurants: Restaurant[]) => void;
}

const EMPTY: Restaurant = { name: "", city: "", cuisine: "", rating: 3, note: "" };
const inputCls =
  "w-full rounded border border-white/10 bg-imperial-charcoal-2 px-2.5 py-1.5 text-sm text-parchment outline-none focus:border-imperial-gold";
const labelCls =
  "font-display mb-1 block text-[0.56rem] uppercase tracking-[0.12em] text-parchment-faint";

export default function RestaurantsSection({ restaurants, editable, onChange }: RestaurantsSectionProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Restaurant>(EMPTY);

  const showForm = adding || editingIdx !== null;

  function startAdd() {
    setDraft(EMPTY);
    setAdding(true);
    setEditingIdx(null);
  }
  function startEdit(i: number) {
    setDraft(restaurants[i]);
    setEditingIdx(i);
    setAdding(false);
  }
  function cancel() {
    setAdding(false);
    setEditingIdx(null);
  }
  function save() {
    const next = [...restaurants];
    if (editingIdx !== null) next[editingIdx] = draft;
    else next.unshift(draft);
    onChange(next);
    cancel();
  }
  function remove(i: number) {
    onChange(restaurants.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center justify-between border-b border-imperial-gold/20 pb-2">
        <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-parchment-faint">
          🍽 Gastronomía
        </span>
        {editable && !showForm && (
          <button
            onClick={startAdd}
            className="font-display rounded-full border border-imperial-gold/25 bg-imperial-gold/8 px-3 py-1 text-[0.56rem] uppercase tracking-[0.1em] text-imperial-gold-bright transition-colors hover:bg-imperial-gold/18"
          >
            + Añadir
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {showForm && (
          <div className="rounded-lg border border-imperial-gold/25 bg-imperial-charcoal-3 p-3.5">
            <div className="mb-2.5 grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Nombre</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Ciudad</label>
                <input
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <label className={labelCls}>Tipo de cocina</label>
            <input
              value={draft.cuisine}
              onChange={(e) => setDraft({ ...draft, cuisine: e.target.value })}
              className={`${inputCls} mb-2.5`}
            />
            <label className={labelCls}>Valoración</label>
            <div className="mb-2.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft({ ...draft, rating: n })}
                  className={`text-2xl leading-none transition-colors ${
                    n <= draft.rating ? "text-imperial-gold-bright" : "text-parchment-faint/40"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <label className={labelCls}>Nota</label>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              rows={2}
              className={`${inputCls} mb-3 resize-none`}
            />
            <div className="flex gap-2">
              <button
                onClick={save}
                className="font-display flex-1 rounded bg-imperial-gold/18 py-2 text-[0.6rem] uppercase tracking-[0.1em] text-imperial-gold-bright"
              >
                Guardar
              </button>
              <button
                onClick={cancel}
                className="font-display rounded border border-white/10 px-3 py-2 text-[0.6rem] uppercase tracking-[0.1em] text-parchment-faint"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {restaurants.length === 0 && !showForm && (
          <p className="py-4 text-center text-xs italic text-parchment-faint">
            Sin restaurantes registrados
          </p>
        )}

        {restaurants.map((r, i) =>
          editingIdx === i ? null : (
            <div key={i} className="rounded-lg border border-white/10 bg-imperial-charcoal-2 p-3.5">
              <div className="font-display text-sm font-medium text-parchment">{r.name || "Restaurante"}</div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[0.64rem] text-parchment-faint">{r.city}</span>
                {r.cuisine && (
                  <span className="rounded border border-imperial-gold/20 bg-imperial-gold/10 px-1.5 py-0.5 text-[0.6rem] text-imperial-gold-text">
                    {r.cuisine}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[0.66rem] tracking-widest text-imperial-gold-text">
                {stars(r.rating)}
              </div>
              {r.note && (
                <p className="mt-1.5 text-[0.74rem] italic leading-relaxed text-parchment-dim">{r.note}</p>
              )}
              {editable && (
                <div className="mt-2.5 flex justify-end gap-1.5">
                  <button
                    onClick={() => startEdit(i)}
                    className="font-display rounded border border-white/10 px-2.5 py-1 text-[0.54rem] uppercase tracking-[0.08em] text-parchment-faint transition-colors hover:border-imperial-gold/40 hover:text-imperial-gold-text"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(i)}
                    className="font-display rounded border border-white/10 px-2.5 py-1 text-[0.54rem] uppercase tracking-[0.08em] text-parchment-faint transition-colors hover:border-red-400/40 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
