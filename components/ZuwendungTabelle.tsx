'use client';

import { useState, useMemo } from 'react';
import type { Spender, Zuwendung, Verein } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { apiGet } from '@/lib/api-client';
import { erstelleEmpfangsbestaetigung } from '@/lib/docx-templates/empfangsbestaetigung';
import { saveAs } from 'file-saver';

interface ZuwendungTabelleProps {
  zuwendungen: Zuwendung[];
  spenderList: Spender[];
  verein?: Verein;
  onEdit: (zuwendung: Zuwendung) => void;
  onDelete: (zuwendung: Zuwendung) => void;
  onShowDetails?: (zuwendung: Zuwendung) => void;
}

export default function ZuwendungTabelle({
  zuwendungen,
  spenderList,
  verein,
  onEdit,
  onDelete,
  onShowDetails,
}: ZuwendungTabelleProps) {
  const [downloadingEB, setDownloadingEB] = useState<string | null>(null);
  const [filterSpender, setFilterSpender] = useState('');
  const [filterJahr, setFilterJahr] = useState('');
  const [filterArt, setFilterArt] = useState<'alle' | 'geld' | 'sach'>('alle');
  const [filterStatus, setFilterStatus] = useState<'alle' | 'offen' | 'bestaetigt'>('alle');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const spenderMap = useMemo(() => {
    const map: Record<string, Spender> = {};
    for (const s of spenderList) map[s.id] = s;
    return map;
  }, [spenderList]);

  const jahre = useMemo(() => {
    const set = new Set(zuwendungen.map((z) => z.datum.substring(0, 4)));
    return [...set].sort().reverse();
  }, [zuwendungen]);

  const filtered = useMemo(() => {
    return zuwendungen
      .filter((z) => {
        if (filterSpender && z.spenderId !== filterSpender) return false;
        if (filterJahr && !z.datum.startsWith(filterJahr)) return false;
        if (filterArt !== 'alle' && z.art !== filterArt) return false;
        if (filterStatus === 'offen' && z.bestaetigungErstellt) return false;
        if (filterStatus === 'bestaetigt' && !z.bestaetigungErstellt) return false;
        return true;
      })
      .sort((a, b) => b.datum.localeCompare(a.datum));
  }, [zuwendungen, filterSpender, filterJahr, filterArt, filterStatus]);

  const summe = useMemo(
    () => filtered.reduce((s, z) => s + Number(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag), 0),
    [filtered]
  );

  const handleEmpfangsbestaetigung = async (z: Zuwendung) => {
    if (!verein) return;
    setDownloadingEB(z.id);
    try {
      const vollstaendig = await apiGet<Zuwendung>(`/api/zuwendungen/${z.id}`);
      const blob = await erstelleEmpfangsbestaetigung(verein, { ...vollstaendig, betrag: Number(vollstaendig.betrag), sachWert: vollstaendig.sachWert != null ? Number(vollstaendig.sachWert) : undefined });
      const spenderName = vollstaendig.spender ? spenderAnzeigename(vollstaendig.spender).replace(/\s+/g, '_') : 'Spender';
      const datumStr = vollstaendig.datum.substring(0, 10);
      saveAs(blob, `Empfangsbestaetigung_${spenderName}_${datumStr}.docx`);
    } finally {
      setDownloadingEB(null);
    }
  };

  const formatDatum = (d: string) => {
    const [y, m, day] = d.substring(0, 10).split('-');
    return `${day}.${m}.${y}`;
  };

  const formatBetrag = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (zuwendungen.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>
        <p className="text-lg mb-2">Noch keine Zuwendungen erfasst.</p>
        <p className="text-sm">Erfassen Sie die erste Zuwendung.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <select
          className="drk-input text-sm"
          value={filterSpender}
          onChange={(e) => setFilterSpender(e.target.value)}
        >
          <option value="">Alle Spender</option>
          {spenderList.map((s) => (
            <option key={s.id} value={s.id}>
              {spenderAnzeigename(s)}
            </option>
          ))}
        </select>
        <select
          className="drk-input text-sm"
          value={filterJahr}
          onChange={(e) => setFilterJahr(e.target.value)}
        >
          <option value="">Alle Jahre</option>
          {jahre.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
        <select
          className="drk-input text-sm"
          value={filterArt}
          onChange={(e) => setFilterArt(e.target.value as typeof filterArt)}
        >
          <option value="alle">Alle Arten</option>
          <option value="geld">Geldspende</option>
          <option value="sach">Sachspende</option>
        </select>
        <select
          className="drk-input text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
        >
          <option value="alle">Alle Status</option>
          <option value="offen">Offen</option>
          <option value="bestaetigt">Bestätigt</option>
        </select>
      </div>

      {/* Desktop-Tabelle */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Datum</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Spender</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Art</th>
              <th className="text-right py-2 px-3" style={{ color: 'var(--text)' }}>Betrag/Wert</th>
              <th className="text-left py-2 px-3" style={{ color: 'var(--text)' }}>Verwendung</th>
              <th className="text-center py-2 px-3" style={{ color: 'var(--text)' }}>Status</th>
              <th className="text-right py-2 px-3" style={{ color: 'var(--text)' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((z) => {
              const spender = spenderMap[z.spenderId];
              const wert = Number(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag);
              return (
                <tr key={z.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                    {formatDatum(z.datum)}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                    {spender ? spenderAnzeigename(spender) : '–'}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>
                    {z.art === 'geld' ? 'Geld' : 'Sach'}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: 'var(--text)' }}>
                    {formatBetrag(wert)} €
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>
                    {z.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag'}
                    {z.bemerkung && (
                      <div className="text-xs italic truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                        {z.bemerkung}
                      </div>
                    )}
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
                  <td className="py-2 px-3 text-right">
                    {z.art === 'sach' && verein && !z.bestaetigungErstellt && (
                      <button
                        className="text-sm underline mr-3"
                        style={{ color: 'var(--info, #17a2b8)' }}
                        disabled={downloadingEB === z.id}
                        onClick={() => handleEmpfangsbestaetigung(z)}
                      >
                        {downloadingEB === z.id ? '...' : 'Empfangsbestätigung'}
                      </button>
                    )}
                    {z.bestaetigungErstellt ? (
                      <button
                        className="text-sm underline mr-3"
                        style={{ color: 'var(--text-light)' }}
                        onClick={() => onShowDetails?.(z)}
                      >
                        Details
                      </button>
                    ) : (
                      <button
                        className="text-sm underline mr-3"
                        style={{ color: 'var(--drk)' }}
                        onClick={() => onEdit(z)}
                      >
                        Bearbeiten
                      </button>
                    )}
                    {!z.bestaetigungErstellt && (
                      deleteConfirm === z.id ? (
                        <span className="text-sm">
                          <button
                            className="underline font-bold mr-2"
                            style={{ color: 'var(--error)' }}
                            onClick={() => {
                              onDelete(z);
                              setDeleteConfirm(null);
                            }}
                          >
                            Ja
                          </button>
                          <button
                            className="underline"
                            style={{ color: 'var(--text-light)' }}
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Nein
                          </button>
                        </span>
                      ) : (
                        <button
                          className="text-sm underline"
                          style={{ color: 'var(--error)' }}
                          onClick={() => setDeleteConfirm(z.id)}
                        >
                          Löschen
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)' }}>
              <td colSpan={3} className="py-2 px-3 font-bold" style={{ color: 'var(--text)' }}>
                Gesamt ({filtered.length} Zuwendungen)
              </td>
              <td className="py-2 px-3 text-right font-bold" style={{ color: 'var(--text)' }}>
                {formatBetrag(summe)} €
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile-Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((z) => {
          const spender = spenderMap[z.spenderId];
          const wert = Number(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag);
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
                    background: z.bestaetigungErstellt ? '#dcfce7' : '#fef3c7',
                    color: z.bestaetigungErstellt ? '#166534' : '#92400e',
                  }}
                >
                  {z.bestaetigungErstellt ? 'Bestätigt' : 'Offen'}
                </span>
              </div>
              <div className="text-sm mb-1" style={{ color: 'var(--text)' }}>
                {spender ? spenderAnzeigename(spender) : '–'}
              </div>
              <div className="text-sm mb-1" style={{ color: 'var(--text-light)' }}>
                {formatDatum(z.datum)} · {z.art === 'geld' ? 'Geld' : 'Sach'} ·{' '}
                {z.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag'}
              </div>
              {z.bemerkung && (
                <div className="text-xs mb-2 italic" style={{ color: 'var(--text-muted)' }}>
                  {z.bemerkung}
                </div>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {z.art === 'sach' && verein && !z.bestaetigungErstellt && (
                  <button
                    className="text-sm px-3 py-2 rounded"
                    style={{ background: 'var(--info-bg)', color: 'var(--info-text)' }}
                    disabled={downloadingEB === z.id}
                    onClick={() => handleEmpfangsbestaetigung(z)}
                  >
                    {downloadingEB === z.id ? '...' : 'Empfangsbestätigung'}
                  </button>
                )}
                {z.bestaetigungErstellt ? (
                  <button className="drk-btn-secondary text-sm flex-1" onClick={() => onShowDetails?.(z)}>
                    Details
                  </button>
                ) : (
                  <>
                    <button className="drk-btn-secondary text-sm flex-1" onClick={() => onEdit(z)}>
                      Bearbeiten
                    </button>
                    <button
                      className="text-sm px-3 py-2 rounded"
                      style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                      onClick={() => onDelete(z)}
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div className="text-center py-3 font-bold" style={{ color: 'var(--text)' }}>
          Gesamt: {formatBetrag(summe)} €
        </div>
      </div>
    </div>
  );
}
