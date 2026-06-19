"use client";

import { useState } from "react";
import { daysBetween, formatDate } from "@/lib/format";
import type { Visit } from "@/lib/types";

interface VisitsSectionProps {
  visits: Visit[];
  editable: boolean;
  onChange: (visits: Visit[]) => void;
  onPhotoClick: (src: string) => void;
}

const EMPTY: Visit = { region: "", dateFrom: "", dateTo: "", note: "", photos: [] };
const inputCls =
  "w-full rounded border border-white/10 bg-imperial-charcoal-2 px-2.5 py-1.5 text-sm text-parchment outline-none focus:border-imperial-gold";
const labelCls =
  "font-display mb-1 block text-[0.56rem] uppercase tracking-[0.12em] text-parchment-faint";

export default function VisitsSection({ visits, editable, onChange, onPhotoClick }: VisitsSectionProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Visit>(EMPTY);

  const showForm = adding || editingIdx !== null;

  function startAdd() {
    setDraft(EMPTY);
    setAdding(true);
    setEditingIdx(null);
  }
  function startEdit(i: number) {
    setDraft(visits[i]);
    setEditingIdx(i);
    setAdding(false);
  }
  function cancel() {
    setAdding(false);
    setEditingIdx(null);
  }
  function save() {
    const next = [...visits];
    if (editingIdx !== null) next[editingIdx] = draft;
    else next.unshift(draft);
    onChange(next);
    cancel();
  }
  function remove(i: number) {
    onChange(visits.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center justify-between border-b border-imperial-gold/20 pb-2">
        <span className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-parchment-faint">
          ⚔ Expediciones
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
            <label className={labelCls}>Zona / Título</label>
            <input
              value={draft.region}
              onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              className={`${inputCls} mb-2.5`}
            />
            <div className="mb-2.5 grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Inicio</label>
                <input
                  type="date"
                  value={draft.dateFrom}
                  onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Fin</label>
                <input
                  type="date"
                  value={draft.dateTo}
                  onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <label className={labelCls}>Notas</label>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              rows={2}
              className={`${inputCls} mb-2.5 resize-none`}
            />
            <label className={labelCls}>Fotos (una URL por línea)</label>
            <textarea
              value={draft.photos.join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  photos: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
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

        {visits.length === 0 && !showForm && (
          <p className="py-4 text-center text-xs italic text-parchment-faint">
            Sin expediciones registradas
          </p>
        )}

        {visits.map((v, i) =>
          editingIdx === i ? null : (
            <div key={i} className="rounded-lg border border-white/10 bg-imperial-charcoal-2 p-3.5">
              <div className="font-display text-sm font-semibold text-parchment">
                {v.region || "Expedición"}
              </div>
              <div className="mt-0.5 text-[0.68rem] text-parchment-faint">
                {v.dateFrom
                  ? `${formatDate(v.dateFrom)}${
                      v.dateTo
                        ? ` → ${formatDate(v.dateTo)} · ${daysBetween(v.dateFrom, v.dateTo)} días`
                        : ""
                    }`
                  : "—"}
              </div>
              {v.note && (
                <p className="mt-1.5 text-[0.76rem] italic leading-relaxed text-parchment-dim">
                  {v.note}
                </p>
              )}
              {v.photos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {v.photos.slice(0, 6).map((src, pi) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={pi}
                      src={src}
                      alt=""
                      onClick={() => onPhotoClick(src)}
                      className="aspect-square cursor-zoom-in rounded object-cover transition-opacity hover:opacity-85"
                    />
                  ))}
                </div>
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
