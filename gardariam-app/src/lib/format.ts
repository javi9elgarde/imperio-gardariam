export function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(`${d}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function stars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function flagUrl(iso: string): string {
  const code = iso.includes("-") ? iso.split("-")[0] : iso;
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
}
