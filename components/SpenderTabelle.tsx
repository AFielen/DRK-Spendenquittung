'use client';

import { useState, useMemo } from 'react';
import type { Spender } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';

interface SpenderTabelleProps {
  spender: Spender[];
  onEdit: (spender: Spender) => void;
  onDelete: (spender: Spender) => void;
  showArchived?: boolean;
  onToggleArchived?: () => void;
}

type SortKey = 'name' | 'ort';
type SortDir = 'asc' | 'desc';

export default function SpenderTabelle({ spender, onEdit, onDelete, showArchived, onToggleArchived }: SpenderTabelleProps) {
  const [suche, setSuche] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = suche.toLowerCase();
    let list = spender;
    if (q) {
      list = list.filter(
        (s) =>
          spenderAnzeigename(s).toLowerCase().includes(q) ||
          (s.firmenname && s.firmenname.toLowerCase().includes(q)) ||
          s.ort.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = spenderAnzeigename(a).localeCompare(spenderAnzeigename(b), 'de');
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          className="drk-input flex-1 min-w-0"
          placeholder="Suche nach Name oder Ort..."
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
        {onToggleArchived && (
          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap" style={{ color: 'var(--text-light)' }}>
            <input
              type="checkbox"
              checked={showArchived ?? false}
              onChange={onToggleArchived}
            />
            Archivierte anzeigen
          </label>
        )}
      </div>

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
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', opacity: s.archiviert ? 0.5 : 1 }}>
                <td className="py-2 px-3" style={{ color: 'var(--text)', textDecoration: s.archiviert ? 'line-through' : 'none' }}>
                  {s.istFirma ? (
                    <span>
                      {s.firmenname}
                      {(s.vorname || s.nachname) && s.firmenname && (
                        <span className="text-xs ml-1" style={{ color: 'var(--text-light)' }}>
                          ({s.vorname ? `${s.vorname} ` : ''}{s.nachname})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>
                      {s.anrede ? `${s.anrede} ` : ''}
                      {s.vorname} {s.nachname}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>
                  {s.strasse}, {s.plz} {s.ort}
                </td>
                <td className="py-2 px-3 text-right" style={{ color: 'var(--text)' }}>
                  {s.zuwendungenCount ?? 0}
                </td>
                <td className="py-2 px-3 text-right" style={{ color: 'var(--text)' }}>
                  {(s.jahresSumme ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    className="text-sm underline mr-3"
                    style={{ color: 'var(--drk)' }}
                    onClick={() => onEdit(s)}
                  >
                    Bearbeiten
                  </button>
                  {s.archiviert ? (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Archiviert</span>
                  ) : deleteConfirm === s.id ? (
                    <span className="text-sm">
                      <button
                        className="underline font-bold mr-2"
                        style={{ color: 'var(--error)' }}
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
                      {(s.zuwendungenCount ?? 0) > 0 ? 'Archivieren' : 'Löschen'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-4 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: s.archiviert ? 0.5 : 1 }}
          >
            <div className="font-bold mb-1" style={{ color: 'var(--text)', textDecoration: s.archiviert ? 'line-through' : 'none' }}>
              {s.istFirma ? (
                <>
                  {s.firmenname}
                  {(s.vorname || s.nachname) && s.firmenname && (
                    <div className="text-xs font-normal" style={{ color: 'var(--text-light)' }}>
                      Ansprechpartner: {s.vorname ? `${s.vorname} ` : ''}{s.nachname}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {s.anrede ? `${s.anrede} ` : ''}
                  {s.vorname} {s.nachname}
                </>
              )}
            </div>
            <div className="text-sm mb-2" style={{ color: 'var(--text-light)' }}>
              {s.strasse}, {s.plz} {s.ort}
            </div>
            <div className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
              {s.zuwendungenCount ?? 0} Zuwendungen · {(s.jahresSumme ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
            </div>
            <div className="flex gap-3">
              <button
                className="drk-btn-secondary text-sm flex-1"
                onClick={() => onEdit(s)}
              >
                Bearbeiten
              </button>
              {s.archiviert ? (
                <span className="text-sm px-3 py-2" style={{ color: 'var(--text-muted)' }}>Archiviert</span>
              ) : deleteConfirm === s.id ? (
                <div className="flex gap-2">
                  <button
                    className="text-sm px-3 py-2 rounded font-bold"
                    style={{ background: 'var(--error)', color: '#fff' }}
                    onClick={() => {
                      onDelete(s);
                      setDeleteConfirm(null);
                    }}
                  >
                    {(s.zuwendungenCount ?? 0) > 0 ? 'Ja, archivieren' : 'Ja, löschen'}
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
                  style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                  onClick={() => setDeleteConfirm(s.id)}
                >
                  {(s.zuwendungenCount ?? 0) > 0 ? 'Archivieren' : 'Löschen'}
                </button>
              )}
            </div>
            {deleteConfirm === s.id && (s.zuwendungenCount ?? 0) > 0 && (
              <div className="text-xs mt-2 p-2 rounded" style={{ background: 'var(--warning-bg, #fffbeb)', color: 'var(--warning-text, #92400e)' }}>
                Dieser Spender hat {s.zuwendungenCount} Zuwendungen und wird archiviert statt gelöscht. Die Zuwendungen bleiben erhalten.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
