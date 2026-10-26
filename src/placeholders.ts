// Platzhalter in eckigen Klammern, z. B. "[Angabe von Zamin]" (Links "[Text](/url)" zählen nicht).
// Lokal (npm run dev) bleiben sie sichtbar markiert, damit klar ist, was noch fehlt.
// Auf der Live-Seite werden sie ausgeblendet: Wo ohne Platzhalter noch ein ganzer Satz übrig
// bleibt, steht nur dieser Satz da; sonst entfällt das Feld bzw. der ganze Abschnitt.
const PH = /\[[^\]]+\](?!\()/g;

export const showPlaceholders = import.meta.env.DEV;

export function hasPlaceholder(text?: string | null): boolean {
  return !!text && /\[[^\]]+\](?!\()/.test(text);
}

/** Text für die Ausgabe – oder null, wenn das Feld (noch) nicht gezeigt werden soll. */
export function ready(text?: string | null): string | null {
  if (!text || !text.trim()) return null;
  if (showPlaceholders || !hasPlaceholder(text)) return text;
  const rest = text.replace(PH, '').replace(/\s{2,}/g, ' ').trim();
  return /[.!?…]$/.test(rest) ? rest : null;
}
