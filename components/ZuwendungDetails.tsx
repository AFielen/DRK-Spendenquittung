'use client';

import type { Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';

interface ZuwendungDetailsProps {
  zuwendung: Zuwendung;
  spender?: Spender;
  onClose: () => void;
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
}

function formatDatum(d: string): string {
  const [y, m, day] = d.substring(0, 10).split('-');
  return `${day}.${m}.${y}`;
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ZUGANGSWEG_LABELS: Record<string, string> = {
  ueberweisung: 'Überweisung',
  bar: 'Bareinzahlung',
  online: 'Online-Spende',
  lastschrift: 'Lastschrift',
  paypal: 'PayPal',
  scheck: 'Scheck',
  sonstig: 'Sonstig',
};

const HERKUNFT_LABELS: Record<string, string> = {
  privatvermoegen: 'Privatvermögen',
  betriebsvermoegen: 'Betriebsvermögen',
  keine_angabe: 'Keine Angabe',
};

const BEWERTUNG_LABELS: Record<string, string> = {
  rechnung: 'Originalrechnung / Kaufbeleg',
  eigene_ermittlung: 'Eigene Wertermittlung',
  gutachten: 'Gutachten / Sachverständiger',
};

const TYP_LABELS: Record<string, string> = {
  anlage3: 'Geldzuwendung (Anlage 3)',
  anlage4: 'Sachzuwendung (Anlage 4)',
  anlage14: 'Sammelbestätigung (Anlage 14)',
  vereinfacht: 'Vereinfachter Nachweis',
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm font-semibold shrink-0 w-40" style={{ color: 'var(--text)' }}>{label}</span>
      <span className="text-sm" style={{ color: 'var(--text-light)' }}>{value}</span>
    </div>
  );
}

export default function ZuwendungDetails({ zuwendung: z, spender, onClose, onDownloadPdf, downloadingPdf }: ZuwendungDetailsProps) {
  const wert = z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Zuwendung — Details
          </h3>
          {z.bestaetigungErstellt && (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              Bestätigt
            </span>
          )}
        </div>

        <div className="space-y-0">
          <Row label="Spender" value={spender ? spenderAnzeigename(spender) : '–'} />
          <Row label="Art" value={z.art === 'geld' ? 'Geldspende' : 'Sachspende'} />
          <Row label="Betrag / Wert" value={`${formatBetrag(wert)} €`} />
          <Row label="Datum" value={formatDatum(z.datum)} />
          <Row label="Verwendung" value={z.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag'} />
          {z.zugangsweg && <Row label="Zugangsweg" value={ZUGANGSWEG_LABELS[z.zugangsweg] ?? z.zugangsweg} />}
          <Row label="Verzicht" value={z.verzicht ? 'Ja' : 'Nein'} />
          {z.bemerkung && <Row label="Bemerkung" value={z.bemerkung} />}

          {z.art === 'sach' && (
            <>
              <Row label="Bezeichnung" value={z.sachBezeichnung} />
              <Row label="Alter" value={z.sachAlter} />
              <Row label="Zustand" value={z.sachZustand} />
              {z.sachKaufpreis != null && <Row label="Kaufpreis" value={`${formatBetrag(z.sachKaufpreis)} €`} />}
              <Row label="Herkunft" value={z.sachHerkunft ? HERKUNFT_LABELS[z.sachHerkunft] : undefined} />
              <Row label="Bewertung" value={z.sachBewertungsgrundlage ? BEWERTUNG_LABELS[z.sachBewertungsgrundlage] : undefined} />
              <Row label="Unterlagen" value={z.sachUnterlagenVorhanden ? 'Vorhanden' : 'Nicht vorhanden'} />
            </>
          )}

          {z.zweckgebunden && <Row label="Zweckbindung" value={z.zweckbindung ?? 'Ja'} />}

          {z.bestaetigungErstellt && (
            <>
              <Row label="Bestätigungstyp" value={z.bestaetigungTyp ? TYP_LABELS[z.bestaetigungTyp] ?? z.bestaetigungTyp : undefined} />
              <Row label="Bestätigt am" value={z.bestaetigungDatum ? formatDatum(z.bestaetigungDatum) : undefined} />
              <Row label="Lfd. Nr." value={z.laufendeNr} />
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button className="drk-btn-secondary flex-1" onClick={onClose}>
            Schließen
          </button>
          {z.bestaetigungErstellt && onDownloadPdf && (
            <button className="drk-btn-primary flex-1" disabled={downloadingPdf} onClick={onDownloadPdf}>
              {downloadingPdf ? 'Generiere...' : 'PDF anzeigen'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
