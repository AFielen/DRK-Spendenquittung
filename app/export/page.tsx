'use client';

import { useEffect, useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import {
  getVerein,
  getSpender,
  getZuwendungen,
  getSettings,
  updateSettings,
  updateZuwendung,
} from '@/lib/storage';
import { pruefFreistellung } from '@/lib/freistellung-check';
import { generateGeldzuwendung } from '@/lib/docx-templates/geldzuwendung';
import { generateSachzuwendung } from '@/lib/docx-templates/sachzuwendung';
import { generateSammelbestaetigung } from '@/lib/docx-templates/sammelbestaetigung';
import { generateVereinfachterNachweis } from '@/lib/docx-templates/vereinfachter-nachweis';
import FreistellungsBlocker from '@/components/FreistellungsBlocker';

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getNextLaufendeNr(): string {
  const settings = getSettings();
  const currentYear = new Date().getFullYear();
  let nr = settings.laufendeNrAktuell;
  if (settings.laufendeNrJahr !== currentYear) {
    nr = 1;
    updateSettings({ laufendeNrJahr: currentYear, laufendeNrAktuell: 1 });
  }
  const formatted = settings.laufendeNrFormat
    .replace('{JAHR}', currentYear.toString())
    .replace('{NR}', nr.toString().padStart(3, '0'));
  updateSettings({ laufendeNrAktuell: nr + 1 });
  return formatted;
}

export default function ExportPage() {
  const [verein, setVereinState] = useState<Verein | null>(null);
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungenState] = useState<Zuwendung[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [optSammel, setOptSammel] = useState(true);
  const [optEinzelSach, setOptEinzelSach] = useState(true);
  const [optVereinfacht, setOptVereinfacht] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [showPflichtHinweis, setShowPflichtHinweis] = useState(false);
  const [pflichtTimer, setPflichtTimer] = useState(5);

  const reload = useCallback(() => {
    setVereinState(getVerein());
    setSpenderList(getSpender());
    setZuwendungenState(getZuwendungen());
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  if (!loaded || !verein) return null;

  const freistellungStatus = pruefFreistellung(verein);
  if (freistellungStatus.status === 'abgelaufen') {
    return (
      <div style={{ background: 'var(--bg)' }}>
        <FreistellungsBlocker verein={verein} blockContent />
      </div>
    );
  }

  const jahre = [...new Set(zuwendungen.map((z) => z.datum.substring(0, 4)))].sort().reverse();
  const jahresZuwendungen = zuwendungen.filter((z) => z.datum.startsWith(selectedYear));
  const spenderMitGeld = new Set(jahresZuwendungen.filter((z) => z.art === 'geld').map((z) => z.spenderId));
  const sachZuwendungen = jahresZuwendungen.filter((z) => z.art === 'sach');
  const kleinZuwendungen = jahresZuwendungen.filter((z) => z.art === 'geld' && z.betrag <= 300);
  const gesamtSumme = jahresZuwendungen.reduce((s, z) => s + (z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag), 0);

  const handleExport = async () => {
    setExporting(true);
    const zip = new JSZip();
    const csvRows: string[] = ['Lfd.Nr;Nachname;Vorname;Art;Betrag;Datum;Typ'];
    let total = 0;
    let done = 0;

    if (optSammel) total += spenderMitGeld.size * 2; // + Doppel
    if (optEinzelSach) total += sachZuwendungen.length * 2;
    if (optVereinfacht) total += kleinZuwendungen.length;
    if (total === 0) total = 1;

    const update = () => {
      done++;
      setProgress(`Generiere Bestätigung ${done} von ${total}...`);
    };

    try {
      // Sammelbestätigungen
      if (optSammel) {
        for (const spenderId of spenderMitGeld) {
          const spender = spenderList.find((s) => s.id === spenderId);
          if (!spender) continue;

          const spenderZuwendungen = jahresZuwendungen.filter(
            (z) => z.spenderId === spenderId && z.art === 'geld'
          );

          const lfdNr = getNextLaufendeNr();
          const blob = await generateSammelbestaetigung(
            verein, spender, spenderZuwendungen,
            `${selectedYear}-01-01`, `${selectedYear}-12-31`, lfdNr, false
          );
          const name = `${spender.nachname}_${spender.vorname}`;
          zip.file(`Bestaetigungen/${name}_Sammelbestaetigung_${selectedYear}.docx`, blob);
          update();

          const doppelBlob = await generateSammelbestaetigung(
            verein, spender, spenderZuwendungen,
            `${selectedYear}-01-01`, `${selectedYear}-12-31`, lfdNr, true
          );
          zip.file(`Doppel/${name}_Sammelbestaetigung_${selectedYear}_DOPPEL.docx`, doppelBlob);
          update();

          const summe = spenderZuwendungen.reduce((s, z) => s + z.betrag, 0);
          csvRows.push(`${lfdNr};${spender.nachname};${spender.vorname};Sammel;${formatBetrag(summe)};${selectedYear};Anlage14`);

          for (const z of spenderZuwendungen) {
            updateZuwendung({
              ...z,
              bestaetigungErstellt: true,
              bestaetigungDatum: new Date().toISOString(),
              bestaetigungTyp: 'anlage14',
              laufendeNr: lfdNr,
              aktualisiertAm: new Date().toISOString(),
            });
          }
        }
      }

      // Sach-Einzelbestätigungen
      if (optEinzelSach) {
        for (const z of sachZuwendungen) {
          const spender = spenderList.find((s) => s.id === z.spenderId);
          if (!spender) continue;

          const lfdNr = getNextLaufendeNr();
          const name = `${spender.nachname}_${spender.vorname}`;
          const blob = await generateSachzuwendung(verein, spender, z, lfdNr, false);
          zip.file(`Bestaetigungen/${name}_Sachzuwendung_${z.datum}.docx`, blob);
          update();

          const doppelBlob = await generateSachzuwendung(verein, spender, z, lfdNr, true);
          zip.file(`Doppel/${name}_Sachzuwendung_${z.datum}_DOPPEL.docx`, doppelBlob);
          update();

          csvRows.push(`${lfdNr};${spender.nachname};${spender.vorname};Sach;${formatBetrag(z.sachWert ?? 0)};${z.datum};Anlage4`);

          updateZuwendung({
            ...z,
            bestaetigungErstellt: true,
            bestaetigungDatum: new Date().toISOString(),
            bestaetigungTyp: 'anlage4',
            laufendeNr: lfdNr,
            aktualisiertAm: new Date().toISOString(),
          });
        }
      }

      // Vereinfachte Nachweise
      if (optVereinfacht) {
        for (const z of kleinZuwendungen) {
          if (z.bestaetigungErstellt) { update(); continue; }
          const spender = spenderList.find((s) => s.id === z.spenderId);
          if (!spender) continue;

          const blob = await generateVereinfachterNachweis(verein, spender, z);
          const name = `${spender.nachname}_${spender.vorname}`;
          zip.file(`Vereinfacht/${name}_Nachweis_${z.datum}.docx`, blob);
          update();

          csvRows.push(`;${spender.nachname};${spender.vorname};Vereinfacht;${formatBetrag(z.betrag)};${z.datum};VN`);
        }
      }

      // CSV-Übersicht
      zip.file(`Uebersicht_${selectedYear}.csv`, '\uFEFF' + csvRows.join('\n'));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `DRK_Spendenquittung_Export_${selectedYear}.zip`);

      updateSettings({ letzterBatchExport: new Date().toISOString() });
      reload();

      // Pflichthinweis
      setShowPflichtHinweis(true);
      setPflichtTimer(5);
      const interval = setInterval(() => {
        setPflichtTimer((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } finally {
      setExporting(false);
      setProgress('');
    }
  };

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        {freistellungStatus.status === 'warnung' && (
          <FreistellungsBlocker verein={verein} />
        )}

        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Batch-Export
          </h2>

          <div className="space-y-4">
            <div>
              <label className="drk-label">Jahr</label>
              <select
                className="drk-input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {jahre.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
                {jahre.length === 0 && <option value={selectedYear}>{selectedYear}</option>}
              </select>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    {spenderMitGeld.size + new Set(sachZuwendungen.map((z) => z.spenderId)).size}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>Spender</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    {jahresZuwendungen.length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>Zuwendungen</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    {formatBetrag(gesamtSumme)} €
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>Gesamtsumme</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={optSammel} onChange={(e) => setOptSammel(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Sammelbestätigungen für alle Spender mit Geldzuwendungen
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={optEinzelSach} onChange={(e) => setOptEinzelSach(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Einzelbestätigungen für Sachzuwendungen
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={optVereinfacht} onChange={(e) => setOptVereinfacht(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Vereinfachte Nachweise für Zuwendungen ≤ 300 €
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked disabled className="opacity-50" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Doppel für Vereinsakte
                  <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>
                    (Pflicht gemäß § 50 Abs. 7 EStDV — 10 Jahre Aufbewahrung)
                  </span>
                </span>
              </label>
            </div>

            {exporting && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--drk-bg)', color: 'var(--text)' }}>
                {progress}
              </div>
            )}

            <button
              className="drk-btn-primary w-full"
              disabled={exporting || jahresZuwendungen.length === 0}
              onClick={handleExport}
            >
              {exporting ? 'Exportiere...' : 'ZIP exportieren'}
            </button>
          </div>
        </div>
      </div>

      {showPflichtHinweis && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-6"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">📁</div>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>
              Bitte speichern Sie diese ZIP-Datei an einem sicheren Ort (z.B. Vereins-NAS,
              USB-Stick, externer Datenträger).
            </p>
            <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--text)' }}>
              Der Ordner &quot;Doppel&quot; muss gemäß § 50 Abs. 7 EStDV mindestens 10 Jahre
              aufbewahrt werden.
            </p>
            <button
              className="drk-btn-primary w-full"
              disabled={pflichtTimer > 0}
              onClick={() => setShowPflichtHinweis(false)}
            >
              {pflichtTimer > 0 ? `Verstanden (${pflichtTimer}s)` : 'Verstanden'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
