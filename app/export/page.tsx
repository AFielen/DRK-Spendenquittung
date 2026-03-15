'use client';

import { useEffect, useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
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
import { erstelleEmpfangsbestaetigung } from '@/lib/docx-templates/empfangsbestaetigung';
import FreistellungsBlocker from '@/components/FreistellungsBlocker';
import FormatToggle, { type ExportFormat } from '@/components/FormatToggle';

async function fetchPdfBlob(
  typ: string,
  spenderId: string,
  zuwendungIds: string[],
  laufendeNr: string,
  doppel: boolean,
  zeitraum?: { von: string; bis: string }
): Promise<Blob> {
  const res = await fetch('/api/dokumente/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ typ, spenderId, zuwendungIds, laufendeNr, doppel, zeitraum }),
  });
  if (!res.ok) throw new Error('PDF-Generierung fehlgeschlagen');
  return res.blob();
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ExportContent() {
  const { kreisverband } = useAuth();
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [optSammel, setOptSammel] = useState(true);
  const [optEinzelSach, setOptEinzelSach] = useState(true);
  const [optVereinfacht, setOptVereinfacht] = useState(true);
  const [optEmpfangsbestaetigung, setOptEmpfangsbestaetigung] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [showPflichtHinweis, setShowPflichtHinweis] = useState(false);
  const [pflichtTimer, setPflichtTimer] = useState(5);

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
    return <div style={{ background: 'var(--bg)' }}><FreistellungsBlocker verein={verein} blockContent /></div>;
  }

  const jahre = [...new Set(zuwendungen.map((z) => new Date(z.datum).getFullYear().toString()))].sort().reverse();
  const jahresZuwendungen = zuwendungen.filter((z) => new Date(z.datum).getFullYear().toString() === selectedYear);
  const spenderMitGeld = new Set(jahresZuwendungen.filter((z) => z.art === 'geld').map((z) => z.spenderId));
  const sachZuwendungen = jahresZuwendungen.filter((z) => z.art === 'sach');
  const kleinZuwendungen = jahresZuwendungen.filter((z) => z.art === 'geld' && z.betrag <= 300);
  const gesamtSumme = jahresZuwendungen.reduce((s, z) => s + (z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag), 0);

  async function getNextLaufendeNr(): Promise<string> {
    const res = await apiPost<{ laufendeNr: string }>('/api/kreisverband/laufendeNr');
    return res.laufendeNr;
  }

  async function markBestaetigt(ids: string[], typ: string, laufendeNr: string) {
    await Promise.all(ids.map((id) => apiPost(`/api/zuwendungen/${id}/bestaetigen`, { bestaetigungTyp: typ, laufendeNr })));
  }

  const handleExport = async () => {
    setExporting(true);
    const zip = new JSZip();
    const csvRows: string[] = ['Lfd.Nr;Nachname;Vorname;Art;Betrag;Datum;Typ'];
    let total = 0;
    let done = 0;
    const ext = format === 'pdf' ? 'pdf' : 'docx';
    const isPdf = format === 'pdf';

    if (optSammel) total += spenderMitGeld.size * 2;
    if (optEinzelSach) total += sachZuwendungen.length * 2;
    if (optVereinfacht) total += kleinZuwendungen.length;
    if (optEmpfangsbestaetigung) total += sachZuwendungen.length;
    if (total === 0) total = 1;

    const update = () => { done++; setProgress(`Generiere Bestätigung ${done} von ${total} (${format.toUpperCase()})...`); };

    try {
      if (optSammel) {
        for (const spenderId of spenderMitGeld) {
          const spender = spenderList.find((s) => s.id === spenderId);
          if (!spender) continue;
          const spenderZuwendungen = jahresZuwendungen.filter((z) => z.spenderId === spenderId && z.art === 'geld');
          const lfdNr = await getNextLaufendeNr();
          const name = spenderAnzeigename(spender).replace(/\s+/g, '_');
          const zeitraum = { von: `${selectedYear}-01-01`, bis: `${selectedYear}-12-31` };

          if (isPdf) {
            const ids = spenderZuwendungen.map((z) => z.id);
            const blob = await fetchPdfBlob('sammelbestaetigung', spenderId, ids, lfdNr, false, zeitraum);
            zip.file(`Bestaetigungen/${name}_Sammelbestaetigung_${selectedYear}.pdf`, blob);
            update();
            const doppelBlob = await fetchPdfBlob('sammelbestaetigung', spenderId, ids, lfdNr, true, zeitraum);
            zip.file(`Doppel/${name}_Sammelbestaetigung_${selectedYear}_DOPPEL.pdf`, doppelBlob);
            update();
          } else {
            const blob = await generateSammelbestaetigung(verein, spender, spenderZuwendungen, zeitraum.von, zeitraum.bis, lfdNr, false);
            zip.file(`Bestaetigungen/${name}_Sammelbestaetigung_${selectedYear}.${ext}`, blob);
            update();
            const doppelBlob = await generateSammelbestaetigung(verein, spender, spenderZuwendungen, zeitraum.von, zeitraum.bis, lfdNr, true);
            zip.file(`Doppel/${name}_Sammelbestaetigung_${selectedYear}_DOPPEL.${ext}`, doppelBlob);
            update();
          }

          const summe = spenderZuwendungen.reduce((s, z) => s + z.betrag, 0);
          csvRows.push(`${lfdNr};${spenderAnzeigename(spender)};Sammel;${formatBetrag(summe)};${selectedYear};Anlage14`);
          await markBestaetigt(spenderZuwendungen.map((z) => z.id), 'anlage14', lfdNr);
        }
      }

      if (optEinzelSach) {
        for (const z of sachZuwendungen) {
          const spender = spenderList.find((s) => s.id === z.spenderId);
          if (!spender) continue;
          const lfdNr = await getNextLaufendeNr();
          const name = spenderAnzeigename(spender).replace(/\s+/g, '_');

          if (isPdf) {
            const blob = await fetchPdfBlob('sachzuwendung', spender.id, [z.id], lfdNr, false);
            zip.file(`Bestaetigungen/${name}_Sachzuwendung.pdf`, blob);
            update();
            const doppelBlob = await fetchPdfBlob('sachzuwendung', spender.id, [z.id], lfdNr, true);
            zip.file(`Doppel/${name}_Sachzuwendung_DOPPEL.pdf`, doppelBlob);
            update();
          } else {
            const blob = await generateSachzuwendung(verein, spender, z, lfdNr, false);
            zip.file(`Bestaetigungen/${name}_Sachzuwendung.${ext}`, blob);
            update();
            const doppelBlob = await generateSachzuwendung(verein, spender, z, lfdNr, true);
            zip.file(`Doppel/${name}_Sachzuwendung_DOPPEL.${ext}`, doppelBlob);
            update();
          }

          csvRows.push(`${lfdNr};${spenderAnzeigename(spender)};Sach;${formatBetrag(z.sachWert ?? 0)};${z.datum};Anlage4`);
          await markBestaetigt([z.id], 'anlage4', lfdNr);
        }
      }

      if (optVereinfacht) {
        for (const z of kleinZuwendungen) {
          if (z.bestaetigungErstellt) { update(); continue; }
          const spender = spenderList.find((s) => s.id === z.spenderId);
          if (!spender) continue;

          if (isPdf) {
            const blob = await fetchPdfBlob('vereinfacht', spender.id, [z.id], '', false);
            zip.file(`Vereinfacht/${spenderAnzeigename(spender).replace(/\s+/g, '_')}_Nachweis.pdf`, blob);
          } else {
            const blob = await generateVereinfachterNachweis(verein, spender, z);
            zip.file(`Vereinfacht/${spenderAnzeigename(spender).replace(/\s+/g, '_')}_Nachweis.${ext}`, blob);
          }
          update();
          csvRows.push(`;${spenderAnzeigename(spender)};Vereinfacht;${formatBetrag(z.betrag)};${z.datum};VN`);
        }
      }

      if (optEmpfangsbestaetigung) {
        for (const z of sachZuwendungen) {
          const spender = spenderList.find((s) => s.id === z.spenderId);
          if (!spender) continue;
          const name = spenderAnzeigename(spender).replace(/\s+/g, '_');

          if (isPdf) {
            const blob = await fetchPdfBlob('empfangsbestaetigung', spender.id, [z.id], '', false);
            zip.file(`Empfangsbestaetigungen/${name}_Empfangsbestaetigung.pdf`, blob);
          } else {
            const vollstaendig: Zuwendung = { ...z, spender: { ...spender }, betrag: Number(z.betrag), sachWert: z.sachWert != null ? Number(z.sachWert) : undefined };
            const blob = await erstelleEmpfangsbestaetigung(verein, vollstaendig);
            zip.file(`Empfangsbestaetigungen/${name}_Empfangsbestaetigung.${ext}`, blob);
          }
          update();
        }
      }

      zip.file(`Uebersicht_${selectedYear}.csv`, '\uFEFF' + csvRows.join('\n'));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `DRK_Spendenquittung_Export_${selectedYear}.zip`);
      await reload();

      setShowPflichtHinweis(true);
      setPflichtTimer(5);
      const interval = setInterval(() => {
        setPflichtTimer((t) => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
      }, 1000);
    } finally {
      setExporting(false);
      setProgress('');
    }
  };

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        {freistellungStatus.status === 'warnung' && <FreistellungsBlocker verein={verein} />}
        <div className="drk-card">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Batch-Export</h2>
            <FormatToggle value={format} onChange={setFormat} />
          </div>
          <div className="space-y-4">
            <div>
              <label className="drk-label">Jahr</label>
              <select className="drk-input" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
                {jahre.length === 0 && <option value={selectedYear}>{selectedYear}</option>}
              </select>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div><div className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>{spenderMitGeld.size + new Set(sachZuwendungen.map((z) => z.spenderId)).size}</div><div className="text-xs" style={{ color: 'var(--text-light)' }}>Spender</div></div>
                <div><div className="text-lg sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>{jahresZuwendungen.length}</div><div className="text-xs" style={{ color: 'var(--text-light)' }}>Zuwendungen</div></div>
                <div><div className="text-lg sm:text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>{formatBetrag(gesamtSumme)}&nbsp;€</div><div className="text-xs" style={{ color: 'var(--text-light)' }}>Gesamtsumme</div></div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={optSammel} onChange={(e) => setOptSammel(e.target.checked)} /><span className="text-sm" style={{ color: 'var(--text)' }}>Sammelbestätigungen für alle Spender mit Geldzuwendungen</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={optEinzelSach} onChange={(e) => setOptEinzelSach(e.target.checked)} /><span className="text-sm" style={{ color: 'var(--text)' }}>Einzelbestätigungen für Sachzuwendungen</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={optVereinfacht} onChange={(e) => setOptVereinfacht(e.target.checked)} /><span className="text-sm" style={{ color: 'var(--text)' }}>Vereinfachte Nachweise für Zuwendungen ≤ 300 €</span></label>
              {sachZuwendungen.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={optEmpfangsbestaetigung} onChange={(e) => setOptEmpfangsbestaetigung(e.target.checked)} /><span className="text-sm" style={{ color: 'var(--text)' }}>Empfangsbestätigungen für Sachspenden mit exportieren</span></label>
              )}
              <label className="flex items-center gap-2"><input type="checkbox" checked disabled className="opacity-50" /><span className="text-sm" style={{ color: 'var(--text-muted)' }}>Doppel für Vereinsakte<span className="text-xs block">(Pflicht gemäß § 50 Abs. 7 EStDV — 10 Jahre Aufbewahrung)</span></span></label>
            </div>
            {exporting && <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--drk-bg)', color: 'var(--text)' }}>{progress}</div>}
            <button className="drk-btn-primary w-full" disabled={exporting || jahresZuwendungen.length === 0} onClick={handleExport}>
              {exporting ? 'Exportiere...' : `ZIP exportieren (${format.toUpperCase()})`}
            </button>
          </div>
        </div>
      </div>

      {showPflichtHinweis && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-6" style={{ background: 'var(--bg-card)' }}>
            <div className="text-center mb-4"><div className="text-3xl mb-2">📁</div></div>
            <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>Bitte speichern Sie diese ZIP-Datei an einem sicheren Ort.</p>
            <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--text)' }}>Der Ordner &quot;Doppel&quot; muss gemäß § 50 Abs. 7 EStDV mindestens 10 Jahre aufbewahrt werden.</p>
            <button className="drk-btn-primary w-full" disabled={pflichtTimer > 0} onClick={() => setShowPflichtHinweis(false)}>
              {pflichtTimer > 0 ? `Verstanden (${pflichtTimer}s)` : 'Verstanden'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExportPage() {
  return <AuthGuard><ExportContent /></AuthGuard>;
}
