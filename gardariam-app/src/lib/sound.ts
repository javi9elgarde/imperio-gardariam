const MUTE_KEY = "gardariam_next_muted_v1";

let audioCtx: AudioContext | null = null;

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/**
 * Los navegadores dejan el audio suspendido hasta que hay un gesto, y el móvil
 * lo vuelve a suspender al cambiar de pestaña. Mientras está suspendido el
 * reloj no avanza: si se programan los sonidos igualmente, se pierden. Por eso
 * se espera al resume antes de tocar nada.
 */
function withCtx(fn: (ctx: AudioContext) => void): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "running") {
      fn(ctx);
      return;
    }
    ctx.resume().then(
      () => fn(ctx),
      () => {},
    );
  } catch {
    // audio unsupported or blocked — fail silently
  }
}

if (typeof window !== "undefined") {
  const wake = () => {
    const ctx = getCtx();
    if (ctx && ctx.state !== "running") void ctx.resume();
  };
  for (const ev of ["pointerdown", "touchstart", "keydown"]) {
    window.addEventListener(ev, wake, { passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) wake();
  });
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  peakGain: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Brief triumphant arpeggio + chord, synthesized — no external audio asset needed. */
export function playFanfare(): void {
  withCtx((ctx) => {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => tone(ctx, f, i * 0.11, 0.32, "triangle", 0.16));
    [523.25, 659.25, 783.99].forEach((f) => tone(ctx, f, 0.46, 0.9, "sawtooth", 0.09));
  });
}

/* ---------------- Sonidos de la interfaz ---------------- */

/** Roce suave al pasar el puntero por una zona */
export function playHover(): void {
  withCtx((ctx) => {
    tone(ctx, 1320, 0, 0.09, "sine", 0.025);
  });
}

/** Primer toque: la zona queda señalada, todavía no se entra */
export function playPick(): void {
  withCtx((ctx) => {
    tone(ctx, 784, 0, 0.11, "triangle", 0.05);
    tone(ctx, 1174.66, 0.05, 0.14, "triangle", 0.035);
  });
}

/** Segundo toque / clic: se entra en la zona */
export function playEnter(): void {
  withCtx((ctx) => {
    tone(ctx, 392, 0, 0.13, "triangle", 0.07);
    tone(ctx, 587.33, 0.07, 0.16, "triangle", 0.06);
    tone(ctx, 783.99, 0.14, 0.3, "triangle", 0.05);
  });
}

/** Cerrar una ventana o cancelar la selección */
export function playBack(): void {
  withCtx((ctx) => {
    tone(ctx, 587.33, 0, 0.12, "sine", 0.04);
    tone(ctx, 392, 0.06, 0.18, "sine", 0.035);
  });
}
