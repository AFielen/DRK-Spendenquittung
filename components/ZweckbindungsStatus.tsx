'use client';

import { useState } from 'react';
import type { Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { apiPost } from '@/lib/api-client';

interface ZweckbindungsStatusProps {
  zuwendungen: Zuwendung[];
  onUpdate: () => void;
}

function formatDatum(d: string): string {
  const dateOnly = d.substring(0, 10);
  const [y, m, day] = dateOnly.split('-');
  return `${day}.${m}.${y}`;
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function alterInTagen(datum: string): number {
  const d = new Date(datum);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function alterLabel(tage: number): string {
  if (tage < 30) return `${tage} Tage`;
  const monate = Math.floor(tage / 30);
  return `${monate} Monate`;
}

function alterFarbe(tage: number): { bg: string; color: string } {
  const monate = tage / 30;
  if (monate > 18) return { bg: '#fef2f2', color: '#991b1b' };
  if (monate > 12) return { bg: '#fffbeb', color: '#92400e' };
  return { bg: '#f0fdf4', color: '#166534' };
}

export default function ZweckbindungsStatus({ zuwendungen, onUpdate }: ZweckbindungsStatusProps) {
  const [markierenId, setMarkierenId] = useState<string | null>(null);
  const [verwendetDatum, setVerwendetDatum] = useState(new Date().toISOString().split('T')[0]);
  const [verwendetNotiz, setVerwendetNotiz] = useState('');
  const [saving, setSaving] = useState(false);

  const offene = zuwendungen
    .filter((z) => z.zweckgebunden && !z.zweckVerwendet)
    .sort((a, b) => a.datum.localeCompare(b.datum));

  if (offene.length === 0) return null;

  const handleMarkieren = async (id: string) => {
    if (!verwendetNotiz.trim()) return;
    setSaving(true);
    try {
      await apiPost(`/api/zuwendungen/${id}/zweck-verwendet`, {
        zweckVerwendetDatum: verwendetDatum,
        zweckVerwendetNotiz: verwendetNotiz.trim(),
      });
      setMarkierenId(null);
      setVerwendetNotiz('');
      setVerwendetDatum(new Date().toISOString().split('T')[0]);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drk-card">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          Offene Zweckbindungen
        </h3>
        <span
          className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: 'var(--drk)', color: '#fff' }}
        >
          {offene.length}
        </span>
      </div>

      <div className="space-y-3">
        {offene.map((z) => {
          const tage = alterInTagen(z.datum);
          const farbe = alterFarbe(tage);
          const wert = z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag;
          return (
            <div key={z.id}>
              <div
                className="p-3 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2"
                style={{ background: farbe.bg, border: `1px solid ${farbe.color}20` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {z.spender ? spenderAnzeigename(z.spender) : '–'} — {formatBetrag(wert)} €
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                    {formatDatum(z.datum)} · Zweck: {z.zweckbindung} · Alter: {alterLabel(tage)}
                  </div>
                </div>
                <button
                  className="text-sm px-3 py-1.5 rounded font-semibold whitespace-nowrap"
                  style={{ background: 'var(--drk)', color: '#fff' }}
                  onClick={() => setMarkierenId(markierenId === z.id ? null : z.id)}
                >
                  Als verwendet markieren
                </button>
              </div>

              {markierenId === z.id && (
                <div className="mt-2 p-3 rounded-lg space-y-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div>
                    <label className="drk-label">Datum der Verwendung</label>
                    <input
                      type="date"
                      className="drk-input"
                      value={verwendetDatum}
                      onChange={(e) => setVerwendetDatum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="drk-label">Verwendungsnotiz *</label>
                    <textarea
                      className="drk-input"
                      rows={2}
                      value={verwendetNotiz}
                      onChange={(e) => setVerwendetNotiz(e.target.value)}
                      placeholder="z.B. Eingesetzt für Anschaffung Zelt Bereitschaft Würselen"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="drk-btn-secondary text-sm"
                      onClick={() => setMarkierenId(null)}
                    >
                      Abbrechen
                    </button>
                    <button
                      className="drk-btn-primary text-sm"
                      disabled={!verwendetNotiz.trim() || saving}
                      onClick={() => handleMarkieren(z.id)}
                    >
                      {saving ? 'Speichere...' : 'Speichern'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
