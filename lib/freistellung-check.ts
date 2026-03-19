import type { Verein } from './types';

export interface FreistellungStatus {
  status: 'gueltig' | 'warnung' | 'kritisch' | 'abgelaufen';
  ablaufDatum: string;
  restMonate: number;
}

export function pruefFreistellung(verein: Verein): FreistellungStatus {
  const bescheidDatum = new Date(verein.freistellungDatum);
  const gueltigkeitJahre = verein.freistellungsart === 'freistellungsbescheid' ? 5 : 3;

  const ablauf = new Date(bescheidDatum);
  ablauf.setFullYear(ablauf.getFullYear() + gueltigkeitJahre);

  const jetzt = new Date();
  const diffMs = ablauf.getTime() - jetzt.getTime();
  const restMonate = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

  const ablaufDatum = ablauf.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (diffMs <= 0) {
    return { status: 'abgelaufen', ablaufDatum, restMonate: 0 };
  }

  if (restMonate < 3) {
    return { status: 'kritisch', ablaufDatum, restMonate };
  }

  if (restMonate < 6) {
    return { status: 'warnung', ablaufDatum, restMonate };
  }

  return { status: 'gueltig', ablaufDatum, restMonate };
}
