'use client';

import type { Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';

interface FristwarnungProps {
  zuwendungen: Zuwendung[];
}

type AmpelStatus = 'gelb' | 'orange' | 'rot';

interface FristEintrag {
  zuwendung: Zuwendung;
  fristEnde: Date;
  restTage: number;
  ampel: AmpelStatus;
}

function formatDatum(d: string): string {
  const dateOnly = d.substring(0, 10);
  const [y, m, day] = dateOnly.split('-');
  return `${day}.${m}.${y}`;
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function berechneFristEnde(datum: string): Date {
  const d = new Date(datum);
  const fristJahr = d.getFullYear() + 2;
  return new Date(fristJahr, 11, 31); // 31.12. des Fristjahres
}

function berechneAmpel(fristEnde: Date): AmpelStatus | null {
  const now = new Date();
  const diffMs = fristEnde.getTime() - now.getTime();
  const diffTage = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffTage < 0) return 'rot';
  if (diffTage <= 90) return 'orange';
  if (diffTage <= 180) return 'gelb';
  return null; // > 6 Monate → nicht anzeigen
}

const AMPEL_CONFIG: Record<AmpelStatus, { bg: string; color: string; border: string; label: string }> = {
  rot: { bg: 'var(--error-bg)', color: 'var(--error-text)', border: 'var(--error-border)', label: 'Frist überschritten – bitte sofort prüfen' },
  orange: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning-border)', label: 'Verausgabung dringend' },
  gelb: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning-border)', label: 'Verausgabung empfohlen' },
};

export default function Fristwarnung({ zuwendungen }: FristwarnungProps) {
  const eintraege: FristEintrag[] = [];

  for (const z of zuwendungen) {
    // Nicht anzeigen für: bereits zweckVerwendet oder bestätigt mit ≤300€
    if (z.zweckVerwendet) continue;
    if (z.bestaetigungErstellt && z.betrag <= 300) continue;

    const fristEnde = berechneFristEnde(z.datum);
    const ampel = berechneAmpel(fristEnde);
    if (!ampel) continue;

    const restTage = Math.ceil((fristEnde.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    eintraege.push({ zuwendung: z, fristEnde, restTage, ampel });
  }

  if (eintraege.length === 0) return null;

  // Sortieren: Rot oben, dann Orange, dann Gelb
  const sortOrder: Record<AmpelStatus, number> = { rot: 0, orange: 1, gelb: 2 };
  eintraege.sort((a, b) => sortOrder[a.ampel] - sortOrder[b.ampel] || a.restTage - b.restTage);

  const hatRot = eintraege.some((e) => e.ampel === 'rot');

  return (
    <div className="drk-card">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          Verausgabungsfristen
        </h3>
        <span
          className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: hatRot ? 'var(--error)' : 'var(--drk)', color: '#fff' }}
        >
          {eintraege.length}
        </span>
      </div>

      <div className="space-y-2">
        {eintraege.map((e) => {
          const wert = e.zuwendung.art === 'sach' ? (e.zuwendung.sachWert ?? 0) : e.zuwendung.betrag;
          const config = AMPEL_CONFIG[e.ampel];
          const fristStr = `${e.fristEnde.getDate().toString().padStart(2, '0')}.${(e.fristEnde.getMonth() + 1).toString().padStart(2, '0')}.${e.fristEnde.getFullYear()}`;
          return (
            <div
              key={e.zuwendung.id}
              className="p-3 rounded-lg"
              style={{ background: config.bg, border: `1px solid ${config.border}` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {e.zuwendung.spender ? spenderAnzeigename(e.zuwendung.spender) : '–'} — {formatBetrag(wert)} €
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                    Eingang: {formatDatum(e.zuwendung.datum)} · Frist: {fristStr}
                  </div>
                </div>
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                  style={{ background: config.border, color: config.color }}
                >
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 p-3 rounded-lg text-xs"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-light)' }}
      >
        Gemäß § 55 Abs. 1 Nr. 5 AO müssen Spendenmittel zeitnah – in der Regel innerhalb von zwei Kalender- oder Wirtschaftsjahren nach Zufluss – verwendet werden.
      </div>
    </div>
  );
}
