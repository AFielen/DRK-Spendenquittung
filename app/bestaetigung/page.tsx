'use client';

import { useEffect, useState, useCallback } from 'react';
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Delay cleanup so mobile browsers can start the download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { apiGet, apiPost } from '@/lib/api-client';
import { pruefFreistellung } from '@/lib/freistellung-check';
import { generateGeldzuwendung } from '@/lib/docx-templates/geldzuwendung';
import { generateSachzuwendung } from '@/lib/docx-templates/sachzuwendung';
import { generateSammelbestaetigung } from '@/lib/docx-templates/sammelbestaetigung';
import { generateVereinfachterNachweis } from '@/lib/docx-templates/vereinfachter-nachweis';
import FreistellungsBlocker from '@/components/FreistellungsBlocker';
import UnterschriftHinweis from '@/components/UnterschriftHinweis';

type Tab = 'einzel' | 'sammel' | 'vereinfacht';

function formatDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BestaetigungContent() {
  const { kreisverband } = useAuth();
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [tab, setTab] = useState<Tab>('einzel');

  const [selectedSpenderId, setSelectedSpenderId] = useState('');
  const [selectedZuwendungId, setSelectedZuwendungId] = useState('');
  const [showUnterschrift, setShowUnterschrift] = useState(false);

  const [sammelSpenderId, setSammelSpenderId] = useState('');
  const [sammelVon, setSammelVon] = useState(`${new Date().getFullYear()}-01-01`);
  const [sammelBis, setSammelBis] = useState(`${new Date().getFullYear()}-12-31`);
  const [showSammelUnterschrift, setShowSammelUnterschrift] = useState(false);

  const [vereinfachtSpenderId, setVereinfachtSpenderId] = useState('');
  const [vereinfachtZuwendungId, setVereinfachtZuwendungId] = useState('');

  const reload = useCallback(async () => {
    const [sp, zw] = await Promise.all([
      apiGet<Spender[]>('/api/spender'),
      apiGet<Zuwendung[]>('/api/zuwendungen'),
    ]);
    setSpenderList(sp);
    setZuwendungen(zw.map((z) => ({ ...z, betrag: Number(z.betrag) })));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!kreisverband) return null;

  const verein: Verein = {
    ...kreisverband,
    freistellungsart: kreisverband.freistellungsart as Verein['freistellungsart'],
  };

  const freistellungStatus = pruefFreistellung(verein);
  if (freistellungStatus.status === 'abgelaufen') {
    return (
      <div style={{ background: 'var(--bg)' }}>
        <FreistellungsBlocker verein={verein} blockContent />
      </div>
    );
  }

  const einzelOffene = zuwendungen.filter(
    (z) => z.spenderId === selectedSpenderId && !z.bestaetigungErstellt
  );
  const selectedZuwendung = zuwendungen.find((z) => z.id === selectedZuwendungId);

  const sammelZuwendungen = zuwendungen.filter(
    (z) =>
      z.spenderId === sammelSpenderId &&
      z.art === 'geld' &&
      z.datum >= sammelVon &&
      z.datum <= sammelBis
  );
  const sammelSumme = sammelZuwendungen.reduce((s, z) => s + z.betrag, 0);

  const vereinfachtOffene = zuwendungen.filter(
    (z) =>
      z.spenderId === vereinfachtSpenderId &&
      z.betrag <= 300 &&
      z.art === 'geld'
  );
  const vereinfachtSelected = zuwendungen.find((z) => z.id === vereinfachtZuwendungId);

  async function getNextLaufendeNr(): Promise<string> {
    const res = await apiPost<{ laufendeNr: string }>('/api/kreisverband/laufendeNr');
    return res.laufendeNr;
  }

  async function markBestaetigt(ids: string[], typ: string, laufendeNr: string) {
    await Promise.all(
      ids.map((id) =>
        apiPost(`/api/zuwendungen/${id}/bestaetigen`, { bestaetigungTyp: typ, laufendeNr })
      )
    );
  }

  const handleEinzelDownload = async (mitDoppel: boolean) => {
    if (!selectedZuwendung) return;
    const spender = spenderList.find((s) => s.id === selectedZuwendung.spenderId);
    if (!spender) return;

    const lfdNr = await getNextLaufendeNr();
    const isGeld = selectedZuwendung.art === 'geld';
    const generator = isGeld ? generateGeldzuwendung : generateSachzuwendung;
    const blob = await generator(verein, spender, selectedZuwendung, lfdNr, false);
    const typ = isGeld ? 'Geldzuwendung' : 'Sachzuwendung';
    const dateiName = spenderAnzeigename(spender).replace(/\s+/g, '_');
    downloadBlob(blob, `${dateiName}_${typ}.docx`);

    if (mitDoppel) {
      const doppelBlob = await generator(verein, spender, selectedZuwendung, lfdNr, true);
      downloadBlob(doppelBlob, `${dateiName}_${typ}_DOPPEL.docx`);
    }

    await markBestaetigt([selectedZuwendung.id], isGeld ? 'anlage3' : 'anlage4', lfdNr);
    setShowUnterschrift(false);
    setSelectedZuwendungId('');
    await reload();
  };

  const handleSammelDownload = async (mitDoppel: boolean) => {
    const spender = spenderList.find((s) => s.id === sammelSpenderId);
    if (!spender || sammelZuwendungen.length === 0) return;

    const lfdNr = await getNextLaufendeNr();
    const blob = await generateSammelbestaetigung(
      verein, spender, sammelZuwendungen, sammelVon, sammelBis, lfdNr, false
    );
    const jahr = sammelVon.substring(0, 4);
    const sammelDateiName = spenderAnzeigename(spender).replace(/\s+/g, '_');
    downloadBlob(blob, `${sammelDateiName}_Sammelbestaetigung_${jahr}.docx`);

    if (mitDoppel) {
      const doppelBlob = await generateSammelbestaetigung(
        verein, spender, sammelZuwendungen, sammelVon, sammelBis, lfdNr, true
      );
      downloadBlob(doppelBlob, `${sammelDateiName}_Sammelbestaetigung_${jahr}_DOPPEL.docx`);
    }

    await markBestaetigt(sammelZuwendungen.map((z) => z.id), 'anlage14', lfdNr);
    setShowSammelUnterschrift(false);
    await reload();
  };

  const handleVereinfachtDownload = async () => {
    if (!vereinfachtSelected) return;
    const spender = spenderList.find((s) => s.id === vereinfachtSelected.spenderId);
    if (!spender) return;

    const blob = await generateVereinfachterNachweis(verein, spender, vereinfachtSelected);
    downloadBlob(blob, `${spenderAnzeigename(spender).replace(/\s+/g, '_')}_Nachweis.docx`);

    await markBestaetigt([vereinfachtSelected.id], 'vereinfacht', '');
    setVereinfachtZuwendungId('');
    await reload();
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'einzel', label: 'Einzelbestätigung' },
    { key: 'sammel', label: 'Sammelbestätigung' },
    { key: 'vereinfacht', label: 'Vereinfacht (≤ 300 €)' },
  ];

  return (
    <div className="py-8 px-4 overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        {freistellungStatus.status === 'warnung' && <FreistellungsBlocker verein={verein} />}

        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Bestätigungen erstellen
          </h2>

          <div className="flex gap-0 mb-6 overflow-x-auto -mx-1 px-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                className="flex-1 py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors min-w-0"
                style={{
                  background: tab === t.key ? 'var(--drk)' : 'var(--bg)',
                  color: tab === t.key ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: t.key === 'einzel' ? '0.5rem 0 0 0.5rem' : t.key === 'vereinfacht' ? '0 0.5rem 0.5rem 0' : '0',
                }}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'einzel' && (
            <div className="space-y-4">
              <div>
                <label className="drk-label">Spender auswählen</label>
                <select
                  className="drk-input"
                  value={selectedSpenderId}
                  onChange={(e) => { setSelectedSpenderId(e.target.value); setSelectedZuwendungId(''); }}
                >
                  <option value="">– Bitte wählen –</option>
                  {spenderList.map((s) => (
                    <option key={s.id} value={s.id}>{spenderAnzeigename(s)}</option>
                  ))}
                </select>
              </div>

              {selectedSpenderId && einzelOffene.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>Keine offenen Zuwendungen für diesen Spender.</p>
              )}

              {einzelOffene.length > 0 && (
                <div>
                  <label className="drk-label">Zuwendung auswählen</label>
                  <div className="space-y-2">
                    {einzelOffene.map((z) => (
                      <label
                        key={z.id}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                        style={{
                          background: selectedZuwendungId === z.id ? 'var(--drk-bg)' : 'var(--bg)',
                          border: `1px solid ${selectedZuwendungId === z.id ? 'var(--drk)' : 'var(--border)'}`,
                        }}
                      >
                        <input type="radio" name="zuwendung" value={z.id} checked={selectedZuwendungId === z.id} onChange={() => setSelectedZuwendungId(z.id)} />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            {formatBetrag(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag)} € — {z.art === 'geld' ? 'Geldspende' : 'Sachspende'}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                            {formatDatum(z.datum)} · {z.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedZuwendung && (
                <button className="drk-btn-primary" onClick={() => setShowUnterschrift(true)}>DOCX herunterladen</button>
              )}
            </div>
          )}

          {tab === 'sammel' && (
            <div className="space-y-4">
              <div>
                <label className="drk-label">Spender auswählen</label>
                <select className="drk-input" value={sammelSpenderId} onChange={(e) => setSammelSpenderId(e.target.value)}>
                  <option value="">– Bitte wählen –</option>
                  {spenderList.map((s) => (
                    <option key={s.id} value={s.id}>{spenderAnzeigename(s)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="drk-label">Von</label>
                  <input type="date" className="drk-input" value={sammelVon} onChange={(e) => setSammelVon(e.target.value)} />
                </div>
                <div>
                  <label className="drk-label">Bis</label>
                  <input type="date" className="drk-input" value={sammelBis} onChange={(e) => setSammelBis(e.target.value)} />
                </div>
              </div>
              {sammelSpenderId && sammelZuwendungen.length > 0 && (
                <div>
                  <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {sammelZuwendungen.length} Geldzuwendungen · Gesamt: {formatBetrag(sammelSumme)} €
                    </div>
                  </div>
                  <button className="drk-btn-primary" onClick={() => setShowSammelUnterschrift(true)}>Sammelbestätigung herunterladen</button>
                </div>
              )}
              {sammelSpenderId && sammelZuwendungen.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>Keine Geldzuwendungen im gewählten Zeitraum.</p>
              )}
            </div>
          )}

          {tab === 'vereinfacht' && (
            <div className="space-y-4">
              <div>
                <label className="drk-label">Spender auswählen</label>
                <select className="drk-input" value={vereinfachtSpenderId} onChange={(e) => { setVereinfachtSpenderId(e.target.value); setVereinfachtZuwendungId(''); }}>
                  <option value="">– Bitte wählen –</option>
                  {spenderList.map((s) => (
                    <option key={s.id} value={s.id}>{spenderAnzeigename(s)}</option>
                  ))}
                </select>
              </div>
              {vereinfachtSpenderId && vereinfachtOffene.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>Keine Geldzuwendungen ≤ 300 € für diesen Spender.</p>
              )}
              {vereinfachtOffene.length > 0 && (
                <div className="space-y-2">
                  {vereinfachtOffene.map((z) => (
                    <label key={z.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: vereinfachtZuwendungId === z.id ? 'var(--drk-bg)' : 'var(--bg)', border: `1px solid ${vereinfachtZuwendungId === z.id ? 'var(--drk)' : 'var(--border)'}` }}>
                      <input type="radio" name="vereinfacht" value={z.id} checked={vereinfachtZuwendungId === z.id} onChange={() => setVereinfachtZuwendungId(z.id)} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatBetrag(z.betrag)} €</div>
                        <div className="text-xs" style={{ color: 'var(--text-light)' }}>{formatDatum(z.datum)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {vereinfachtSelected && (
                <button className="drk-btn-primary" onClick={handleVereinfachtDownload}>Vereinfachten Nachweis herunterladen</button>
              )}
            </div>
          )}
        </div>

        {/* ── Archivierte Belege ── */}
        <ArchivierteBestaetigung zuwendungen={zuwendungen} spenderList={spenderList} />
      </div>

      {showUnterschrift && <UnterschriftHinweis onDownload={handleEinzelDownload} onCancel={() => setShowUnterschrift(false)} />}
      {showSammelUnterschrift && <UnterschriftHinweis onDownload={handleSammelDownload} onCancel={() => setShowSammelUnterschrift(false)} />}
    </div>
  );
}

function bestaetigungTypLabel(typ?: string | null): string {
  switch (typ) {
    case 'anlage3': return 'Geldzuwendung';
    case 'anlage4': return 'Sachzuwendung';
    case 'anlage14': return 'Sammelbestätigung';
    case 'vereinfacht': return 'Vereinfacht';
    default: return typ ?? '–';
  }
}

function ArchivierteBestaetigung({ zuwendungen, spenderList }: { zuwendungen: Zuwendung[]; spenderList: Spender[] }) {
  const [showArchiv, setShowArchiv] = useState(false);
  const archiviert = zuwendungen.filter((z) => z.bestaetigungErstellt);

  if (archiviert.length === 0) return null;

  return (
    <div className="drk-card mt-6">
      <button
        onClick={() => setShowArchiv(!showArchiv)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          Archivierte Belege ({archiviert.length})
        </h2>
        <span className="text-sm" style={{ color: 'var(--text-light)' }}>
          {showArchiv ? 'Ausblenden' : 'Anzeigen'}
        </span>
      </button>

      {showArchiv && (
        <div className="mt-4 space-y-2">
          {archiviert.map((z) => {
            const spender = spenderList.find((s) => s.id === z.spenderId);
            return (
              <div
                key={z.id}
                className="p-3 rounded-lg text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>
                      {spender ? spenderAnzeigename(spender) : '–'}
                    </span>
                    <span className="mx-2" style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--text)' }}>
                      {formatBetrag(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag)} €
                    </span>
                  </div>
                  <span className="drk-badge-success">{bestaetigungTypLabel(z.bestaetigungTyp)}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                  Spende vom {formatDatum(z.datum)}
                  {z.bestaetigungDatum && ` · Bestätigt am ${formatDatum(z.bestaetigungDatum)}`}
                  {z.laufendeNr && ` · Nr. ${z.laufendeNr}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BestaetigungPage() {
  return (
    <AuthGuard>
      <BestaetigungContent />
    </AuthGuard>
  );
}
