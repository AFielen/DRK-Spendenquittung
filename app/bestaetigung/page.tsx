'use client';

import { useEffect, useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import {
  getVerein,
  getSpender,
  getZuwendungen,
  updateZuwendung,
  getSettings,
  updateSettings,
} from '@/lib/storage';
import { pruefFreistellung } from '@/lib/freistellung-check';
import { generateGeldzuwendung } from '@/lib/docx-templates/geldzuwendung';
import { generateSachzuwendung } from '@/lib/docx-templates/sachzuwendung';
import { generateSammelbestaetigung } from '@/lib/docx-templates/sammelbestaetigung';
import { generateVereinfachterNachweis } from '@/lib/docx-templates/vereinfachter-nachweis';
import FreistellungsBlocker from '@/components/FreistellungsBlocker';
import UnterschriftHinweis from '@/components/UnterschriftHinweis';

type Tab = 'einzel' | 'sammel' | 'vereinfacht';

function formatDatum(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

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

export default function BestaetigungPage() {
  const [verein, setVereinState] = useState<Verein | null>(null);
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungenState] = useState<Zuwendung[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('einzel');

  // Einzel
  const [selectedSpenderId, setSelectedSpenderId] = useState('');
  const [selectedZuwendungId, setSelectedZuwendungId] = useState('');
  const [showUnterschrift, setShowUnterschrift] = useState(false);

  // Sammel
  const [sammelSpenderId, setSammelSpenderId] = useState('');
  const [sammelVon, setSammelVon] = useState(`${new Date().getFullYear()}-01-01`);
  const [sammelBis, setSammelBis] = useState(`${new Date().getFullYear()}-12-31`);
  const [showSammelUnterschrift, setShowSammelUnterschrift] = useState(false);

  // Vereinfacht
  const [vereinfachtSpenderId, setVereinfachtSpenderId] = useState('');
  const [vereinfachtZuwendungId, setVereinfachtZuwendungId] = useState('');

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

  // Einzel-Daten
  const einzelOffene = zuwendungen.filter(
    (z) => z.spenderId === selectedSpenderId && !z.bestaetigungErstellt
  );
  const selectedZuwendung = zuwendungen.find((z) => z.id === selectedZuwendungId);

  // Sammel-Daten
  const sammelZuwendungen = zuwendungen.filter(
    (z) =>
      z.spenderId === sammelSpenderId &&
      z.art === 'geld' &&
      z.datum >= sammelVon &&
      z.datum <= sammelBis
  );
  const sammelSumme = sammelZuwendungen.reduce((s, z) => s + z.betrag, 0);

  // Vereinfacht-Daten
  const vereinfachtOffene = zuwendungen.filter(
    (z) =>
      z.spenderId === vereinfachtSpenderId &&
      z.betrag <= 300 &&
      z.art === 'geld'
  );
  const vereinfachtSelected = zuwendungen.find((z) => z.id === vereinfachtZuwendungId);

  const handleEinzelDownload = async (mitDoppel: boolean) => {
    if (!selectedZuwendung) return;
    const spender = spenderList.find((s) => s.id === selectedZuwendung.spenderId);
    if (!spender) return;

    const lfdNr = getNextLaufendeNr();
    const isGeld = selectedZuwendung.art === 'geld';
    const generator = isGeld ? generateGeldzuwendung : generateSachzuwendung;
    const blob = await generator(verein, spender, selectedZuwendung, lfdNr, false);
    const typ = isGeld ? 'Geldzuwendung' : 'Sachzuwendung';
    saveAs(blob, `${spender.nachname}_${spender.vorname}_${typ}_${selectedZuwendung.datum}.docx`);

    if (mitDoppel) {
      const doppelBlob = await generator(verein, spender, selectedZuwendung, lfdNr, true);
      saveAs(doppelBlob, `${spender.nachname}_${spender.vorname}_${typ}_${selectedZuwendung.datum}_DOPPEL.docx`);
    }

    updateZuwendung({
      ...selectedZuwendung,
      bestaetigungErstellt: true,
      bestaetigungDatum: new Date().toISOString(),
      bestaetigungTyp: isGeld ? 'anlage3' : 'anlage4',
      laufendeNr: lfdNr,
      aktualisiertAm: new Date().toISOString(),
    });

    setShowUnterschrift(false);
    setSelectedZuwendungId('');
    reload();
  };

  const handleSammelDownload = async (mitDoppel: boolean) => {
    const spender = spenderList.find((s) => s.id === sammelSpenderId);
    if (!spender || sammelZuwendungen.length === 0) return;

    const lfdNr = getNextLaufendeNr();
    const blob = await generateSammelbestaetigung(
      verein, spender, sammelZuwendungen, sammelVon, sammelBis, lfdNr, false
    );
    const jahr = sammelVon.substring(0, 4);
    saveAs(blob, `${spender.nachname}_${spender.vorname}_Sammelbestaetigung_${jahr}.docx`);

    if (mitDoppel) {
      const doppelBlob = await generateSammelbestaetigung(
        verein, spender, sammelZuwendungen, sammelVon, sammelBis, lfdNr, true
      );
      saveAs(doppelBlob, `${spender.nachname}_${spender.vorname}_Sammelbestaetigung_${jahr}_DOPPEL.docx`);
    }

    for (const z of sammelZuwendungen) {
      updateZuwendung({
        ...z,
        bestaetigungErstellt: true,
        bestaetigungDatum: new Date().toISOString(),
        bestaetigungTyp: 'anlage14',
        laufendeNr: lfdNr,
        aktualisiertAm: new Date().toISOString(),
      });
    }

    setShowSammelUnterschrift(false);
    reload();
  };

  const handleVereinfachtDownload = async () => {
    if (!vereinfachtSelected) return;
    const spender = spenderList.find((s) => s.id === vereinfachtSelected.spenderId);
    if (!spender) return;

    const blob = await generateVereinfachterNachweis(verein, spender, vereinfachtSelected);
    saveAs(blob, `${spender.nachname}_${spender.vorname}_Nachweis_${vereinfachtSelected.datum}.docx`);

    updateZuwendung({
      ...vereinfachtSelected,
      bestaetigungErstellt: true,
      bestaetigungDatum: new Date().toISOString(),
      bestaetigungTyp: 'vereinfacht',
      aktualisiertAm: new Date().toISOString(),
    });
    setVereinfachtZuwendungId('');
    reload();
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'einzel', label: 'Einzelbestätigung' },
    { key: 'sammel', label: 'Sammelbestätigung' },
    { key: 'vereinfacht', label: 'Vereinfacht (≤ 300 €)' },
  ];

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        {freistellungStatus.status === 'warnung' && (
          <FreistellungsBlocker verein={verein} />
        )}

        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Bestätigungen erstellen
          </h2>

          {/* Tabs */}
          <div className="flex gap-0 mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                className="flex-1 py-2 px-3 text-sm font-semibold transition-colors"
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

          {/* Tab 1 — Einzelbestätigung */}
          {tab === 'einzel' && (
            <div className="space-y-4">
              <div>
                <label className="drk-label">Spender auswählen</label>
                <select
                  className="drk-input"
                  value={selectedSpenderId}
                  onChange={(e) => {
                    setSelectedSpenderId(e.target.value);
                    setSelectedZuwendungId('');
                  }}
                >
                  <option value="">– Bitte wählen –</option>
                  {spenderList.map((s) => (
                    <option key={s.id} value={s.id}>{s.vorname} {s.nachname}</option>
                  ))}
                </select>
              </div>

              {selectedSpenderId && einzelOffene.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                  Keine offenen Zuwendungen für diesen Spender.
                </p>
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
                        <input
                          type="radio"
                          name="zuwendung"
                          value={z.id}
                          checked={selectedZuwendungId === z.id}
                          onChange={() => setSelectedZuwendungId(z.id)}
                        />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            {formatBetrag(z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag)} € —{' '}
                            {z.art === 'geld' ? 'Geldspende' : 'Sachspende'}
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
                <button
                  className="drk-btn-primary"
                  onClick={() => setShowUnterschrift(true)}
                >
                  DOCX herunterladen
                </button>
              )}
            </div>
          )}

          {/* Tab 2 — Sammelbestätigung */}
          {tab === 'sammel' && (
            <div className="space-y-4">
              <div>
                <label className="drk-label">Spender auswählen</label>
                <select
                  className="drk-input"
                  value={sammelSpenderId}
                  onChange={(e) => setSammelSpenderId(e.target.value)}
                >
                  <option value="">– Bitte wählen –</option>
                  {spenderList.map((s) => (
                    <option key={s.id} value={s.id}>{s.vorname} {s.nachname}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="drk-label">Von</label>
                  <input
                    type="date"
                    className="drk-input"
                    value={sammelVon}
                    onChange={(e) => setSammelVon(e.target.value)}
                  />
                </div>
                <div>
                  <label className="drk-label">Bis</label>
                  <input
                    type="date"
                    className="drk-input"
                    value={sammelBis}
                    onChange={(e) => setSammelBis(e.target.value)}
                  />
                </div>
              </div>

              {sammelSpenderId && sammelZuwendungen.length > 0 && (
                <div>
                  <div
                    className="p-3 rounded-lg mb-3"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {sammelZuwendungen.length} Geldzuwendungen · Gesamt: {formatBetrag(sammelSumme)} €
                    </div>
                  </div>

                  <button
                    className="drk-btn-primary"
                    onClick={() => setShowSammelUnterschrift(true)}
                  >
                    Sammelbestätigung herunterladen
                  </button>
                </div>
              )}

              {sammelSpenderId && sammelZuwendungen.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                  Keine Geldzuwendungen im gewählten Zeitraum für diesen Spender.
                </p>
              )}
            </div>
          )}

          {/* Tab 3 — Vereinfachter Nachweis */}
          {tab === 'vereinfacht' && (
            <div className="space-y-4">
              <div>
                <label className="drk-label">Spender auswählen</label>
                <select
                  className="drk-input"
                  value={vereinfachtSpenderId}
                  onChange={(e) => {
                    setVereinfachtSpenderId(e.target.value);
                    setVereinfachtZuwendungId('');
                  }}
                >
                  <option value="">– Bitte wählen –</option>
                  {spenderList.map((s) => (
                    <option key={s.id} value={s.id}>{s.vorname} {s.nachname}</option>
                  ))}
                </select>
              </div>

              {vereinfachtSpenderId && vereinfachtOffene.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                  Keine Geldzuwendungen ≤ 300 € für diesen Spender.
                </p>
              )}

              {vereinfachtOffene.length > 0 && (
                <div className="space-y-2">
                  {vereinfachtOffene.map((z) => (
                    <label
                      key={z.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                      style={{
                        background: vereinfachtZuwendungId === z.id ? 'var(--drk-bg)' : 'var(--bg)',
                        border: `1px solid ${vereinfachtZuwendungId === z.id ? 'var(--drk)' : 'var(--border)'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="vereinfacht"
                        value={z.id}
                        checked={vereinfachtZuwendungId === z.id}
                        onChange={() => setVereinfachtZuwendungId(z.id)}
                      />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {formatBetrag(z.betrag)} €
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                          {formatDatum(z.datum)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {vereinfachtSelected && (
                <button className="drk-btn-primary" onClick={handleVereinfachtDownload}>
                  Vereinfachten Nachweis herunterladen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showUnterschrift && (
        <UnterschriftHinweis
          onDownload={handleEinzelDownload}
          onCancel={() => setShowUnterschrift(false)}
        />
      )}

      {showSammelUnterschrift && (
        <UnterschriftHinweis
          onDownload={handleSammelDownload}
          onCancel={() => setShowSammelUnterschrift(false)}
        />
      )}
    </div>
  );
}
