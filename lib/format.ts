/** Format ISO date string as German DD.MM.YYYY */
export function formatDatum(iso: string | null | undefined): string {
  if (!iso) return '–';
  const dateOnly = iso.substring(0, 10);
  const [y, m, d] = dateOnly.split('-');
  return `${d}.${m}.${y}`;
}

/** Format number as German currency string (e.g. 1.234,56) */
export function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
