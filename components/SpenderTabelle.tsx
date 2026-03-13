'use client';

import { useState, useMemo } from 'react';
import type { Spender, Zuwendung } from '@/lib/types';

interface SpenderTabelleProps {
  spender: Spender[];
  zuwendungen: Zuwendung[];
  onEdit: (spender: Spender) => void;
  onDelete: (spender: Spender) => void;
}

type SortKey = 'name' | 'ort';
type SortDir = 'asc' | 'desc';

export default function SpenderTabelle({ spender, zuwendungen, onEdit, onDelete }: SpenderTabelleProps) {
  const [suche, setSuche] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const zuwendungenBySpender = useMemo(() => {
    const map: Record<string, { count: number; summe: number }> = {};
    for (const z of zuwendungen) {
      if (!map[z.spenderId]) map[z.spenderId] = { count: 0, summe: 0 };
      map[z.spenderId].count++;
      map[z.spenderId].summe += z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag;
    }
    return map;
  }, [zuwendungen]);

  const filtered = useMemo(() => {
    const q = suche.toLowerCase();
    let list = spender;
    if (q) {
      list = list.filter(
        (s) =>
          `${s.vorname} ${s.nachname}`.toLowerCase().includes(q) ||
          s.ort.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = `${a.nachname} ${a.vorname}`.localeCompare(`${b.nachname} ${b.vorname}`, 'de');
      } else {
        cmp = a.ort.localeCompare(b.ort, 'de');
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [spender, suche, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  if (spender.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>
        <p className="text-lg mb-2">Noch keine Spender angelegt.</p>
        <p className="text-sm">Legen Sie Ihren ersten Spender an.</p>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        className="drk-input mb-4"
        placeholder="Suche nach Name oder Ort..."
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
      />

      {/* Desktop-Tabelle */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th
                className="text-left py-2 px-3 cursor-pointer select-none"
                style={{ color: 'var(--text)' }}
                onClick={() => toggleSort('name')}
              >
                Name{sortIcon('name')}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer select-none"
                style={{ color: 'var(--text)' }}
                onClick={() => toggleSort('ort')}
              >
                Adresse{sortIcon('ort')}
              </th>
              <th className="text-right py-2 px-3" style={{ color: 'var(--text)' }}>
                Zuwendungen
              </th>
              <th className="text-right py-2 px-3" style={{ color: 'var(--text)' }}>
                Jahressumme
              </th>
              <th className="text-right py-2 px-3" style={{ color: 'var(--text)' }}>
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const stats = zuwendungenBySpender[s.id] ?? { count: 0, summe: 0 };
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                    {s.anrede ? `${s.anrede} ` : ''}
                    {s.vorname} {s.nachname}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>
                    {s.strasse}, {s.plz} {s.ort}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: 'var(--text)' }}>
                    {stats.count}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: 'var(--text)' }}>
                    {stats.summe.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      className="text-sm underline mr-3"
                      style={{ color: 'var(--drk)' }}
                      onClick={() => onEdit(s)}
                    >
                      Bearbeiten
                    </button>
                    {deleteConfirm === s.id ? (
                      <span className="text-sm">
                        <button
                          className="underline font-bold mr-2"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            onDelete(s);
                            setDeleteConfirm(null);
                          }}
                        >
                          Bestätigen
                        </button>
                        <button
                          className="underline"
                          style={{ color: 'var(--text-light)' }}
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Abbrechen
                        </button>
                      </span>
                    ) : (
                      <button
                        className="text-sm underline"
                        style={{ color: '#dc2626' }}
                        onClick={() => setDeleteConfirm(s.id)}
                      >
                        Löschen
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile-Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((s) => {
          const stats = zuwendungenBySpender[s.id] ?? { count: 0, summe: 0 };
          return (
            <div
              key={s.id}
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="font-bold mb-1" style={{ color: 'var(--text)' }}>
                {s.anrede ? `${s.anrede} ` : ''}
                {s.vorname} {s.nachname}
              </div>
              <div className="text-sm mb-2" style={{ color: 'var(--text-light)' }}>
                {s.strasse}, {s.plz} {s.ort}
              </div>
              <div className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
                {stats.count} Zuwendungen · {stats.summe.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </div>
              <div className="flex gap-3">
                <button
                  className="drk-btn-secondary text-sm flex-1"
                  onClick={() => onEdit(s)}
                >
                  Bearbeiten
                </button>
                {deleteConfirm === s.id ? (
                  <div className="flex gap-2">
                    <button
                      className="text-sm px-3 py-2 rounded font-bold"
                      style={{ background: '#dc2626', color: '#fff' }}
                      onClick={() => {
                        onDelete(s);
                        setDeleteConfirm(null);
                      }}
                    >
                      Ja, löschen
                    </button>
                    <button
                      className="drk-btn-secondary text-sm"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    className="text-sm px-3 py-2 rounded"
                    style={{ background: '#fef2f2', color: '#dc2626' }}
                    onClick={() => setDeleteConfirm(s.id)}
                  >
                    Löschen
                  </button>
                )}
              </div>
              {deleteConfirm === s.id && stats.count > 0 && (
                <div className="text-xs mt-2 p-2 rounded" style={{ background: '#fef2f2', color: '#991b1b' }}>
                  Dieser Spender hat {stats.count} Zuwendungen. Beim Löschen werden auch alle
                  zugehörigen Zuwendungen gelöscht.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
