'use client';

import { useState, useMemo } from 'react';
import type { Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { formatDatum, formatBetrag } from '@/lib/format';

interface SpendenbuchProps {
  zuwendungen: Zuwendung[];
}

const ZUGANGSWEG_LABELS: Record<string, string> = {
  ueberweisung: 'Überweisung',
  bar: 'Bar',
  online: 'Online',
  paypal: 'PayPal',
  lastschrift: 'Lastschrift',
  scheck: 'Scheck',
  sonstig: 'Sonstig',
};

export default function Spendenbuch({ zuwendungen }: SpendenbuchProps) {
  const [filterJahr, setFilterJahr] = useState('');
  const [filterArt, setFilterArt] = useState<'alle' | 'geld' | 'sach'>('alle');
  const [filterZugangsweg, setFilterZugangsweg] = useState('alle');
  const [filterStatus, setFilterStatus] = useState<'alle' | 'offen' | 'quittiert'>('alle');

  const jahre = useMemo(() => {
    const set = new Set(zuwendungen.map((z) => z.datum.substring(0, 4)));
    return [...set].sort().reverse();
  }, [zuwendungen]);

  const filtered = useMemo(() => {
    return zuwendungen
      .filter((z) => {
        if (filterJahr && !z.datum.startsWith(filterJahr)) return false;
        if (filterArt !== 'alle' && z.art !== filterArt) return false;
        if (filterZugangsweg !== 'alle' && z.zugangsweg !== filterZugangsweg) return false;
        if (filterStatus === 'offen' && z.bestaetigungErstellt) return false;
        if (filterStatus === 'quittiert' && !z.bestaetigungErstellt) return false;
        return true;
      })
      .sort((a, b) => b.datum.localeCompare(a.datum));
  }, [zuwendungen, filterJahr, filterArt, filterZugangsweg, filterStatus]);

  const stats = useMemo(() => {
    const gesamt = filtered.length;
    const gesamtSumme = filtered.reduce((s, z) => s + Number(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag), 0);
    const geldZuwendungen = filtered.filter((z) => z.art === 'geld');
    const sachZuwendungen = filtered.filter((z) => z.art === 'sach');
    const geldSumme = geldZuwendungen.reduce((s, z) => s + Number(z.betrag), 0);
    const sachSumme = sachZuwendungen.reduce((s, z) => s + Number(z.sachWert ?? 0), 0);
    return { gesamt, gesamtSumme, geldCount: geldZuwendungen.length, geldSumme, sachCount: sachZuwendungen.length, sachSumme };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <div className="drk-card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.gesamt}</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>Zuwendungen</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{formatBetrag(stats.gesamtSumme)} €</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>Gesamtsumme</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>{formatBetrag(stats.geldSumme)} €</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>{stats.geldCount} Geldspende{stats.geldCount !== 1 ? 'n' : ''}</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>{formatBetrag(stats.sachSumme)} €</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>{stats.sachCount} Sachspende{stats.sachCount !== 1 ? 'n' : ''}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select className="drk-input text-sm" value={filterJahr} onChange={(e) => setFilterJahr(e.target.value)}>
          <option value="">Alle Jahre</option>
          {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select className="drk-input text-sm" value={filterArt} onChange={(e) => setFilterArt(e.target.value as typeof filterArt)}>
          <option value="alle">Alle Arten</option>
          <option value="geld">Geldspende</option>
          <option value="sach">Sachspende</option>
        </select>
        <select className="drk-input text-sm" value={filterZugangsweg} onChange={(e) => setFilterZugangsweg(e.target.value)}>
          <option value="alle">Alle Zugangswege</option>
          <option value="ueberweisung">Überweisung</option>
          <option value="bar">Bareinzahlung</option>
          <option value="online">Online-Spende</option>
          <option value="lastschrift">Lastschrift</option>
          <option value="paypal">PayPal</option>
          <option value="scheck">Scheck</option>
          <option value="sonstig">Sonstig</option>
        </select>
        <select className="drk-input text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}>
          <option value="alle">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="quittiert">Quittiert</option>
        </select>
      </div>

      {/* Desktop-Tabelle */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Lfd. Nr.</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Datum</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Spender</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Art</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Zugangsweg</th>
              <th className="text-right py-2 px-3" style={{ color: 'var(--text)' }}>Betrag</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Zweck / Bemerkung</th>
              <th className="text-center py-2 px-3" style={{ color: 'var(--text)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((z, index) => {
              const wert = Number(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag);
              const zugangLabel = z.zugangsweg ? ZUGANGSWEG_LABELS[z.zugangsweg] : null;
              const bemerkungKurz = z.bemerkung && z.bemerkung.length > 50
                ? z.bemerkung.substring(0, 50) + '…'
                : z.bemerkung;
              return (
                <tr key={z.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {z.laufendeNr ?? (filtered.length - index)}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                    {formatDatum(z.datum)}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                    {z.spender ? spenderAnzeigename(z.spender) : '–'}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: z.art === 'geld' ? 'var(--info-bg)' : 'var(--warning-bg)',
                        color: z.art === 'geld' ? 'var(--info-text)' : 'var(--warning-text)',
                      }}
                    >
                      {z.art === 'geld' ? 'Geld' : 'Sach'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm" style={{ color: 'var(--text-light)' }}>
                    {zugangLabel ?? '–'}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--text)' }}>
                    {formatBetrag(wert)} €
                  </td>
                  <td className="py-2 px-3 text-sm max-w-[200px]" style={{ color: 'var(--text-muted)' }} title={z.bemerkung ?? undefined}>
                    {bemerkungKurz || '–'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: z.bestaetigungErstellt ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: z.bestaetigungErstellt ? 'var(--success)' : 'var(--warning-text)',
                      }}
                    >
                      {z.bestaetigungErstellt ? 'Bestätigt' : 'Offen'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)' }}>
              <td colSpan={5} className="py-2 px-3 font-bold" style={{ color: 'var(--text)' }}>
                Gesamt ({filtered.length} Zuwendungen)
              </td>
              <td className="py-2 px-3 text-right font-bold" style={{ color: 'var(--text)' }}>
                {formatBetrag(stats.gesamtSumme)} €
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile-Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((z) => {
          const wert = Number(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag);
          const zugangLabel = z.zugangsweg ? ZUGANGSWEG_LABELS[z.zugangsweg] : null;
          return (
            <div
              key={z.id}
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold" style={{ color: 'var(--text)' }}>
                  {formatBetrag(wert)} €
                </div>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: z.bestaetigungErstellt ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color: z.bestaetigungErstellt ? 'var(--success)' : 'var(--warning-text)',
                  }}
                >
                  {z.bestaetigungErstellt ? 'Bestätigt' : 'Offen'}
                </span>
              </div>
              <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>
                {z.spender ? spenderAnzeigename(z.spender) : '–'}
              </div>
              <div className="text-sm mb-1" style={{ color: 'var(--text-light)' }}>
                {formatDatum(z.datum)} ·{' '}
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold"
                  style={{
                    background: z.art === 'geld' ? 'var(--info-bg)' : 'var(--warning-bg)',
                    color: z.art === 'geld' ? 'var(--info-text)' : 'var(--warning-text)',
                  }}
                >
                  {z.art === 'geld' ? 'Geld' : 'Sach'}
                </span>
                {zugangLabel && (
                  <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    · {zugangLabel}
                  </span>
                )}
              </div>
              {z.bemerkung && (
                <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  {z.bemerkung}
                </div>
              )}
            </div>
          );
        })}
        <div className="text-center py-3 font-bold" style={{ color: 'var(--text)' }}>
          Gesamt: {formatBetrag(stats.gesamtSumme)} €
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>
          <p className="text-lg mb-2">Keine Einträge gefunden.</p>
          <p className="text-sm">Passen Sie die Filter an oder erfassen Sie neue Zuwendungen.</p>
        </div>
      )}
    </div>
  );
}
