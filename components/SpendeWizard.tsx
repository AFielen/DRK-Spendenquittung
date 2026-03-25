'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Spender, Verein, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { apiPost } from '@/lib/api-client';
import { pruefFreistellung } from '@/lib/freistellung-check';
import { pruefSetupVollstaendigkeit } from '@/lib/setup-check';
import { useWizardState } from '@/lib/use-spende-wizard';

interface SpendeWizardProps {
  spenderList: Spender[];
  verein: Verein;
  onComplete: () => void;
  onCancel: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export default function SpendeWizard({
  spenderList,
  verein,
  onComplete,
  onCancel,
}: SpendeWizardProps) {
  // ── Wizard state (useReducer-basiert) ──
  const {
    state: w,
    setStep, setSaving, setError, setMode, setSpenderId, setSpenderSuche,
    setDropdownOpen, setHighlightedIndex, setDuplicateWarning,
    updateSpenderForm, updateZuwendungForm, setAbschlussWahl,
    setCreatedSpender, setBestaetigungErstellt, setBestaetigungWarnung,
    selectSpender: selectSpenderAction, reset,
  } = useWizardState();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Destructure for convenience
  const { step, saving, error, mode, spenderId, spenderSuche, dropdownOpen, highlightedIndex, duplicateWarning } = w;
  const { istFirma, firmenname, anrede, vorname, nachname, strasse, plz, ort, steuerIdNr } = w.spenderForm;
  const { art, verwendung, betrag, datum, zugangsweg, verzicht, bemerkung, zweckgebunden, zweckbindung } = w.zuwendungForm;
  const { sachBezeichnung, sachAlter, sachZustand, sachKaufpreis, sachWert, sachHerkunft, sachBewertungsgrundlage, sachWertermittlung, sachEntnahmewert, sachUmsatzsteuer, sachUnterlagenVorhanden } = w.zuwendungForm;
  const { abschlussWahl, createdSpender, bestaetigungErstellt, bestaetigungWarnung } = w;

  // ── Computed ──
  const parsedBetrag = parseFloat(betrag) || 0;
  const parsedSachWert = parseFloat(sachWert) || 0;
  const effectiveBetrag = art === 'sach' ? parsedSachWert : parsedBetrag;

  const freistellungStatus = pruefFreistellung(verein);
  const setupStatus = pruefSetupVollstaendigkeit(verein);

  const filteredSpender = useMemo(() => {
    if (!spenderSuche) return spenderList.filter((s) => !s.archiviert);
    const q = spenderSuche.toLowerCase();
    return spenderList.filter(
      (s) =>
        !s.archiviert &&
        (spenderAnzeigename(s).toLowerCase().includes(q) ||
          (s.firmenname && s.firmenname.toLowerCase().includes(q)) ||
          s.ort.toLowerCase().includes(q))
    );
  }, [spenderList, spenderSuche]);

  const selectedSpender = spenderList.find((s) => s.id === spenderId);

  // ── Dropdown handlers ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const selectSpender = useCallback((s: Spender) => {
    selectSpenderAction(s);
    setSpenderSuche(spenderAnzeigename(s));
  }, [selectSpenderAction, setSpenderSuche]);

  const handleSpenderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!dropdownOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setDropdownOpen(true);
          setHighlightedIndex(0);
          e.preventDefault();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(Math.min(highlightedIndex + 1, filteredSpender.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(Math.max(highlightedIndex - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredSpender.length) {
            selectSpender(filteredSpender[highlightedIndex]);
          }
          break;
        case 'Escape':
          setDropdownOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [dropdownOpen, highlightedIndex, filteredSpender, selectSpender]
  );

  // ── Duplicate detection ──
  useEffect(() => {
    if (mode !== 'create') {
      setDuplicateWarning(null);
      return;
    }
    const trimmedNachname = nachname.trim().toLowerCase();
    const trimmedPlz = plz.trim();
    if (!trimmedNachname || !trimmedPlz) {
      setDuplicateWarning(null);
      return;
    }
    const match = spenderList.find(
      (s) =>
        s.nachname.toLowerCase() === trimmedNachname && s.plz === trimmedPlz
    );
    setDuplicateWarning(match ?? null);
  }, [mode, nachname, plz, spenderList]);

  // ── Validation ──
  const canProceedStep1 =
    mode === 'select'
      ? !!spenderId
      : istFirma
        ? !!(firmenname.trim() && strasse.trim() && plz.trim() && ort.trim())
        : !!(vorname.trim() && nachname.trim() && strasse.trim() && plz.trim() && ort.trim());

  const canProceedStep2 =
    art === 'geld'
      ? !!(datum && parsedBetrag > 0)
      : !!(datum && sachBezeichnung.trim() && parsedSachWert > 0 && sachUnterlagenVorhanden);

  // ── Step labels ──
  const stepLabels = ['Spender', 'Zuwendung', 'Abschluss', 'Fertig'];

  // ── Save flow ──
  const handleFinish = async () => {
    setSaving(true);
    setError('');
    setBestaetigungWarnung('');

    try {
      // 1. Create spender if new
      let finalSpenderId = spenderId;
      if (mode === 'create') {
        const newSpender = await apiPost<Spender>('/api/spender', {
          istFirma,
          firmenname: istFirma ? firmenname.trim() : undefined,
          anrede: istFirma ? undefined : anrede || undefined,
          vorname: istFirma ? (vorname.trim() || undefined) : vorname.trim(),
          nachname: istFirma ? (nachname.trim() || firmenname.trim()) : nachname.trim(),
          strasse: strasse.trim(),
          plz: plz.trim(),
          ort: ort.trim(),
          steuerIdNr: steuerIdNr.trim() || undefined,
        });
        finalSpenderId = newSpender.id;
        setCreatedSpender(newSpender);
      }

      // 2. Create zuwendung
      const zuwendungBody: Record<string, unknown> = {
        spenderId: finalSpenderId,
        art,
        verwendung,
        betrag: art === 'geld' ? parsedBetrag : parsedSachWert,
        datum,
        zugangsweg: art === 'geld' && zugangsweg ? zugangsweg : undefined,
        verzicht,
        bemerkung: bemerkung.trim() || undefined,
        zweckgebunden,
        zweckbindung: zweckgebunden ? zweckbindung.trim() : undefined,
        sachBezeichnung: art === 'sach' ? sachBezeichnung.trim() : undefined,
        sachAlter: art === 'sach' ? sachAlter.trim() || undefined : undefined,
        sachZustand: art === 'sach' ? sachZustand.trim() || undefined : undefined,
        sachKaufpreis: art === 'sach' && sachKaufpreis ? parseFloat(sachKaufpreis) : undefined,
        sachWert: art === 'sach' ? parsedSachWert : undefined,
        sachHerkunft: art === 'sach' ? sachHerkunft : undefined,
        sachBewertungsgrundlage: art === 'sach' ? sachBewertungsgrundlage : undefined,
        sachWertermittlung: art === 'sach' ? sachWertermittlung.trim() || undefined : undefined,
        sachEntnahmewert:
          art === 'sach' && sachHerkunft === 'betriebsvermoegen' && sachEntnahmewert
            ? parseFloat(sachEntnahmewert)
            : undefined,
        sachUmsatzsteuer:
          art === 'sach' && sachHerkunft === 'betriebsvermoegen' && sachUmsatzsteuer
            ? parseFloat(sachUmsatzsteuer)
            : undefined,
        sachUnterlagenVorhanden: art === 'sach' ? sachUnterlagenVorhanden : false,
      };

      const newZuwendung = await apiPost<Zuwendung>('/api/zuwendungen', zuwendungBody);

      // 3. If immediate confirmation chosen
      if (abschlussWahl === 'bestaetigung') {
        try {
          const lfdNrRes = await apiPost<{ laufendeNr: string }>('/api/kreisverband/laufendeNr');
          const typ = art === 'geld' ? 'anlage3' : 'anlage4';
          await apiPost(`/api/zuwendungen/${newZuwendung.id}/bestaetigen`, {
            bestaetigungTyp: typ,
            laufendeNr: lfdNrRes.laufendeNr,
          });

          // Generate PDF
          const pdfTyp = art === 'geld' ? 'geldzuwendung' : 'sachzuwendung';
          const spenderName = mode === 'create'
            ? (istFirma ? firmenname.trim() : `${vorname.trim()} ${nachname.trim()}`)
            : (selectedSpender ? spenderAnzeigename(selectedSpender) : 'Spender');
          const dateiName = spenderName.replace(/\s+/g, '_');

          const res = await fetch('/api/dokumente/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              typ: pdfTyp,
              spenderId: finalSpenderId,
              zuwendungIds: [newZuwendung.id],
              laufendeNr: lfdNrRes.laufendeNr,
              doppel: false,
            }),
          });
          if (res.ok) {
            const blob = await res.blob();
            downloadBlob(blob, `${dateiName}_${art === 'geld' ? 'Geldzuwendung' : 'Sachzuwendung'}.pdf`);
          }

          setBestaetigungErstellt(true);
        } catch (err) {
          // Zuwendung was saved but confirmation failed
          setBestaetigungWarnung(
            err instanceof Error ? err.message : 'Bestätigung konnte nicht erstellt werden.'
          );
        }
      }

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset for "another donation" ──
  const handleReset = () => reset();

  // ── Display name helper ──
  const getSpenderDisplayName = () => {
    if (mode === 'select' && selectedSpender) {
      return spenderAnzeigename(selectedSpender);
    }
    if (mode === 'create') {
      return istFirma ? firmenname.trim() : `${vorname.trim()} ${nachname.trim()}`;
    }
    return '–';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={step !== 4 ? onCancel : undefined} />
      <div
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Neue Spende erfassen
          </h3>
          {step < 4 && (
            <button
              type="button"
              className="text-sm px-2 py-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={onCancel}
              aria-label="Schließen"
            >
              ✕
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-6">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className="h-1 rounded-full transition-colors"
                style={{ background: i + 1 <= step ? 'var(--drk)' : 'var(--border)' }}
              />
              <div
                className="text-xs mt-1 text-center"
                style={{ color: i + 1 === step ? 'var(--drk)' : 'var(--text-muted)' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
          >
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 1: Spender                             */}
        {/* ═══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            {mode === 'select' ? (
              <>
                {/* Spender autocomplete */}
                <div ref={dropdownRef} className="relative">
                  <label className="drk-label">Spender suchen</label>
                  <input
                    ref={inputRef}
                    type="text"
                    className="drk-input"
                    placeholder="Name oder Ort eingeben..."
                    role="combobox"
                    aria-expanded={dropdownOpen}
                    aria-controls="wizard-spender-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={
                      highlightedIndex >= 0 ? `wizard-spender-${highlightedIndex}` : undefined
                    }
                    value={spenderSuche}
                    onChange={(e) => {
                      setSpenderSuche(e.target.value);
                      setSpenderId('');
                      setDropdownOpen(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onKeyDown={handleSpenderKeyDown}
                  />
                  {spenderSuche && (
                    <button
                      type="button"
                      className="absolute right-3 top-[2.35rem] text-sm"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => {
                        setSpenderSuche('');
                        setSpenderId('');
                        setDropdownOpen(true);
                        inputRef.current?.focus();
                      }}
                      aria-label="Suche löschen"
                    >
                      ✕
                    </button>
                  )}
                  {dropdownOpen && (
                    <ul
                      ref={listRef}
                      id="wizard-spender-listbox"
                      role="listbox"
                      className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg shadow-lg border"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    >
                      {filteredSpender.length === 0 ? (
                        <li className="px-3 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                          Keine Spender gefunden
                        </li>
                      ) : (
                        filteredSpender.map((s, i) => (
                          <li
                            key={s.id}
                            id={`wizard-spender-${i}`}
                            role="option"
                            aria-selected={s.id === spenderId}
                            className="px-3 py-2 text-sm cursor-pointer transition-colors"
                            style={{
                              background: i === highlightedIndex ? 'var(--drk-bg)' : undefined,
                              color: s.id === spenderId ? 'var(--drk)' : 'var(--text)',
                              fontWeight: s.id === spenderId ? 600 : undefined,
                            }}
                            onMouseEnter={() => setHighlightedIndex(i)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSpender(s);
                            }}
                          >
                            {spenderAnzeigename(s)}{' '}
                            <span style={{ color: 'var(--text-muted)' }}>
                              ({s.plz} {s.ort})
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  {selectedSpender && !dropdownOpen && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {selectedSpender.strasse}, {selectedSpender.plz} {selectedSpender.ort}
                    </div>
                  )}
                </div>

                {/* New spender button */}
                <button
                  type="button"
                  className="w-full py-3 px-4 text-sm font-semibold rounded-lg transition-colors"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--drk)',
                    border: '1px dashed var(--drk)',
                  }}
                  onClick={() => {
                    setMode('create');
                    setSpenderId('');
                    setSpenderSuche('');
                  }}
                >
                  + Neuen Spender anlegen
                </button>
              </>
            ) : (
              <>
                {/* Inline spender form */}
                <div className="flex items-center justify-between">
                  <span className="drk-label">Neuer Spender</span>
                  <button
                    type="button"
                    className="text-xs underline"
                    style={{ color: 'var(--drk)' }}
                    onClick={() => {
                      setMode('select');
                      setDuplicateWarning(null);
                    }}
                  >
                    Bestehenden auswählen
                  </button>
                </div>

                {/* Duplicate warning */}
                {duplicateWarning && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{
                      background: 'var(--warning-bg)',
                      border: '1px solid var(--warning-border)',
                      color: 'var(--warning-text)',
                    }}
                  >
                    <div className="font-semibold mb-1">Mögliches Duplikat gefunden</div>
                    <div>
                      {spenderAnzeigename(duplicateWarning)}, {duplicateWarning.plz}{' '}
                      {duplicateWarning.ort}
                    </div>
                    <button
                      type="button"
                      className="text-xs underline mt-2 inline-block font-semibold"
                      onClick={() => {
                        selectSpender(duplicateWarning);
                        setMode('select');
                      }}
                    >
                      Diesen Spender verwenden
                    </button>
                  </div>
                )}

                {/* Spendertyp toggle */}
                <div>
                  <label className="drk-label">Spendertyp</label>
                  <div className="flex gap-0 mt-1">
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 text-sm font-semibold transition-colors"
                      style={{
                        background: !istFirma ? 'var(--drk)' : 'var(--bg)',
                        color: !istFirma ? '#fff' : 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem 0 0 0.5rem',
                      }}
                      onClick={() => updateSpenderForm('istFirma', false)}
                    >
                      Privatperson
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 text-sm font-semibold transition-colors"
                      style={{
                        background: istFirma ? 'var(--drk)' : 'var(--bg)',
                        color: istFirma ? '#fff' : 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: '0 0.5rem 0.5rem 0',
                      }}
                      onClick={() => updateSpenderForm('istFirma', true)}
                    >
                      Firma / Organisation
                    </button>
                  </div>
                </div>

                {istFirma ? (
                  <>
                    <div>
                      <label className="drk-label">Firmenname / Organisation *</label>
                      <input
                        type="text"
                        className="drk-input"
                        value={firmenname}
                        onChange={(e) => updateSpenderForm('firmenname', e.target.value)}
                        placeholder="z.B. Mustermann GmbH"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="drk-label">Ansprechpartner Vorname</label>
                        <input
                          type="text"
                          className="drk-input"
                          value={vorname}
                          onChange={(e) => updateSpenderForm('vorname', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="drk-label">Ansprechpartner Nachname</label>
                        <input
                          type="text"
                          className="drk-input"
                          value={nachname}
                          onChange={(e) => updateSpenderForm('nachname', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="drk-label">Anrede (optional)</label>
                      <select
                        className="drk-input"
                        value={anrede}
                        onChange={(e) => updateSpenderForm('anrede', e.target.value)}
                      >
                        <option value="">– Keine –</option>
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="drk-label">Vorname *</label>
                        <input
                          type="text"
                          className="drk-input"
                          value={vorname}
                          onChange={(e) => updateSpenderForm('vorname', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="drk-label">Nachname *</label>
                        <input
                          type="text"
                          className="drk-input"
                          value={nachname}
                          onChange={(e) => updateSpenderForm('nachname', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="drk-label">Straße *</label>
                  <input
                    type="text"
                    className="drk-input"
                    value={strasse}
                    onChange={(e) => updateSpenderForm('strasse', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-3">
                  <div>
                    <label className="drk-label">PLZ *</label>
                    <input
                      type="text"
                      className="drk-input"
                      value={plz}
                      onChange={(e) => updateSpenderForm('plz', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="drk-label">Ort *</label>
                    <input
                      type="text"
                      className="drk-input"
                      value={ort}
                      onChange={(e) => updateSpenderForm('ort', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="drk-label">
                    {istFirma ? 'Steuernummer (optional)' : 'Steuer-ID (optional)'}
                  </label>
                  <input
                    type="text"
                    className="drk-input"
                    value={steuerIdNr}
                    onChange={(e) => updateSpenderForm('steuerIdNr', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" className="drk-btn-secondary" onClick={onCancel}>
                Abbrechen
              </button>
              <button
                type="button"
                className="drk-btn-primary"
                disabled={!canProceedStep1}
                onClick={() => {
                  setError('');
                  setStep(2);
                }}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 2: Zuwendung                           */}
        {/* ═══════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Art Toggle */}
            <div>
              <label className="drk-label">Art der Zuwendung</label>
              <div className="flex gap-0 mt-1">
                <button
                  type="button"
                  className="flex-1 py-2 px-4 text-sm font-semibold rounded-l-lg transition-colors"
                  style={{
                    background: art === 'geld' ? 'var(--drk)' : 'var(--bg)',
                    color: art === 'geld' ? '#fff' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => updateZuwendungForm('art', 'geld')}
                >
                  Geldspende
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 px-4 text-sm font-semibold rounded-r-lg transition-colors"
                  style={{
                    background: art === 'sach' ? 'var(--drk)' : 'var(--bg)',
                    color: art === 'sach' ? '#fff' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => updateZuwendungForm('art', 'sach')}
                >
                  Sachspende
                </button>
              </div>
            </div>

            {art === 'geld' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label">Betrag (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="drk-input"
                      value={betrag}
                      onChange={(e) => updateZuwendungForm('betrag', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="drk-label">Datum *</label>
                    <input
                      type="date"
                      className="drk-input"
                      value={datum}
                      onChange={(e) => updateZuwendungForm('datum', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="drk-label">Zugangsweg (optional)</label>
                  <select
                    className="drk-input"
                    value={zugangsweg}
                    onChange={(e) => updateZuwendungForm('zugangsweg', e.target.value)}
                  >
                    <option value="">– Keine Angabe –</option>
                    <option value="ueberweisung">Überweisung</option>
                    <option value="bar">Bareinzahlung</option>
                    <option value="online">Online-Spende</option>
                    <option value="lastschrift">Lastschrift</option>
                    <option value="paypal">PayPal</option>
                    <option value="scheck">Scheck</option>
                    <option value="sonstig">Sonstig</option>
                  </select>
                </div>

                <div>
                  <label className="drk-label">Verwendung</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wizard-verwendung"
                        checked={verwendung === 'spende'}
                        onChange={() => updateZuwendungForm('verwendung', 'spende')}
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        Spende
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wizard-verwendung"
                        checked={verwendung === 'mitgliedsbeitrag'}
                        onChange={() => updateZuwendungForm('verwendung', 'mitgliedsbeitrag')}
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        Beitrag
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verzicht}
                      onChange={(e) => updateZuwendungForm('verzicht', e.target.checked)}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Verzicht auf Erstattung von Aufwendungen
                    </span>
                  </label>
                </div>

                <div>
                  <label className="drk-label">Bemerkung (intern, optional)</label>
                  <textarea
                    className="drk-input"
                    rows={2}
                    value={bemerkung}
                    onChange={(e) => updateZuwendungForm('bemerkung', e.target.value)}
                    placeholder="z.B. für die Jugendarbeit..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zweckgebunden}
                      onChange={(e) => updateZuwendungForm('zweckgebunden', e.target.checked)}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Zweckgebunden
                    </span>
                  </label>
                  {zweckgebunden && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="drk-input"
                        value={zweckbindung}
                        onChange={(e) => updateZuwendungForm('zweckbindung', e.target.value)}
                        placeholder="z.B. Jugendarbeit, Katastrophenhilfe..."
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sach fields */}
                <div>
                  <label className="drk-label">Bezeichnung des Gegenstands *</label>
                  <input
                    type="text"
                    className="drk-input"
                    value={sachBezeichnung}
                    onChange={(e) => updateZuwendungForm('sachBezeichnung', e.target.value)}
                    placeholder="z.B. Laptop Dell Latitude 5520"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label">Alter</label>
                    <input
                      type="text"
                      className="drk-input"
                      value={sachAlter}
                      onChange={(e) => updateZuwendungForm('sachAlter', e.target.value)}
                      placeholder="z.B. ca. 3 Jahre"
                    />
                  </div>
                  <div>
                    <label className="drk-label">Zustand</label>
                    <input
                      type="text"
                      className="drk-input"
                      value={sachZustand}
                      onChange={(e) => updateZuwendungForm('sachZustand', e.target.value)}
                      placeholder="z.B. gut erhalten"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label">Kaufpreis (€, optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="drk-input"
                      value={sachKaufpreis}
                      onChange={(e) => updateZuwendungForm('sachKaufpreis', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="drk-label">Wert (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="drk-input"
                      value={sachWert}
                      onChange={(e) => updateZuwendungForm('sachWert', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="drk-label">Datum *</label>
                  <input
                    type="date"
                    className="drk-input"
                    value={datum}
                    onChange={(e) => updateZuwendungForm('datum', e.target.value)}
                  />
                </div>

                {/* Herkunft */}
                <div>
                  <label className="drk-label">Herkunft</label>
                  <div className="space-y-2 mt-1">
                    {(
                      [
                        ['privatvermoegen', 'Privatvermögen'],
                        ['betriebsvermoegen', 'Betriebsvermögen'],
                        ['keine_angabe', 'Keine Angabe des Zuwendenden'],
                      ] as const
                    ).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="wizard-herkunft"
                          checked={sachHerkunft === value}
                          onChange={() => updateZuwendungForm('sachHerkunft', value)}
                        />
                        <span className="text-sm" style={{ color: 'var(--text)' }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {sachHerkunft === 'betriebsvermoegen' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="drk-label">Entnahmewert (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="drk-input"
                        value={sachEntnahmewert}
                        onChange={(e) => updateZuwendungForm('sachEntnahmewert', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="drk-label">Umsatzsteuer (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="drk-input"
                        value={sachUmsatzsteuer}
                        onChange={(e) => updateZuwendungForm('sachUmsatzsteuer', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Bewertungsgrundlage */}
                <div>
                  <label className="drk-label">Bewertungsgrundlage</label>
                  <div className="space-y-2 mt-1">
                    {(
                      [
                        ['rechnung', 'Originalrechnung / Kaufbeleg vorhanden'],
                        ['eigene_ermittlung', 'Eigene Wertermittlung (Vergleichsrecherche)'],
                        ['gutachten', 'Gutachten / Sachverständiger'],
                      ] as const
                    ).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="wizard-bewertungsgrundlage"
                          checked={sachBewertungsgrundlage === value}
                          onChange={() => updateZuwendungForm('sachBewertungsgrundlage', value)}
                        />
                        <span className="text-sm" style={{ color: 'var(--text)' }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="drk-label">
                    {sachBewertungsgrundlage === 'eigene_ermittlung'
                      ? 'Bewertungsnotiz'
                      : 'Unterlagen zur Wertermittlung'}
                  </label>
                  {sachBewertungsgrundlage === 'eigene_ermittlung' ? (
                    <textarea
                      className="drk-input"
                      rows={2}
                      value={sachWertermittlung}
                      onChange={(e) => updateZuwendungForm('sachWertermittlung', e.target.value)}
                      placeholder="z.B. Vergleich mit eBay-Kleinanzeigen..."
                    />
                  ) : (
                    <input
                      type="text"
                      className="drk-input"
                      value={sachWertermittlung}
                      onChange={(e) => updateZuwendungForm('sachWertermittlung', e.target.value)}
                      placeholder="z.B. Rechnung vom 15.03.2024"
                    />
                  )}
                </div>

                {parsedSachWert > 5000 && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{
                      background: 'var(--warning-bg)',
                      border: '1px solid var(--warning-border)',
                      color: 'var(--warning-text)',
                    }}
                  >
                    Bei Werten über 5.000 € empfiehlt sich ein Sachverständigengutachten.
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sachUnterlagenVorhanden}
                      onChange={(e) => updateZuwendungForm('sachUnterlagenVorhanden', e.target.checked)}
                    />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      Geeignete Unterlagen zur Wertermittlung liegen vor *
                    </span>
                  </label>
                  {!sachUnterlagenVorhanden && (
                    <div className="text-xs mt-1" style={{ color: 'var(--error)' }}>
                      Pflicht, um fortzufahren.
                    </div>
                  )}
                </div>

                <div>
                  <label className="drk-label">Verwendung</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wizard-verwendung-sach"
                        checked={verwendung === 'spende'}
                        onChange={() => updateZuwendungForm('verwendung', 'spende')}
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        Spende
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="wizard-verwendung-sach"
                        checked={verwendung === 'mitgliedsbeitrag'}
                        onChange={() => updateZuwendungForm('verwendung', 'mitgliedsbeitrag')}
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        Beitrag
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="drk-label">Bemerkung (intern, optional)</label>
                  <textarea
                    className="drk-input"
                    rows={2}
                    value={bemerkung}
                    onChange={(e) => updateZuwendungForm('bemerkung', e.target.value)}
                    placeholder="z.B. für die Jugendarbeit..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zweckgebunden}
                      onChange={(e) => updateZuwendungForm('zweckgebunden', e.target.checked)}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Zweckgebunden
                    </span>
                  </label>
                  {zweckgebunden && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="drk-input"
                        value={zweckbindung}
                        onChange={(e) => updateZuwendungForm('zweckbindung', e.target.value)}
                        placeholder="z.B. Jugendarbeit, Katastrophenhilfe..."
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                className="drk-btn-secondary"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
              >
                Zurück
              </button>
              <button
                type="button"
                className="drk-btn-primary"
                disabled={!canProceedStep2}
                onClick={() => {
                  setError('');
                  setStep(3);
                }}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 3: Abschluss                           */}
        {/* ═══════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Summary */}
            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Zusammenfassung
              </div>
              <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                {getSpenderDisplayName()}{mode === 'create' && (
                  <span
                    className="ml-1 text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}
                  >
                    neu
                  </span>
                )}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                {art === 'geld' ? 'Geldspende' : 'Sachspende'} ·{' '}
                {effectiveBetrag.toLocaleString('de-DE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                €
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {art === 'sach' && sachBezeichnung.trim() && `${sachBezeichnung.trim()} · `}
                {new Date(datum).toLocaleDateString('de-DE')}
                {verwendung === 'mitgliedsbeitrag' && ' · Mitgliedsbeitrag'}
              </div>
            </div>

            {/* Choice */}
            <div className="space-y-3">
              <label
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                style={{
                  border: `2px solid ${abschlussWahl === 'spendenbuch' ? 'var(--drk)' : 'var(--border)'}`,
                  background: abschlussWahl === 'spendenbuch' ? 'var(--drk-bg)' : undefined,
                }}
              >
                <input
                  type="radio"
                  name="wizard-abschluss"
                  className="mt-0.5"
                  checked={abschlussWahl === 'spendenbuch'}
                  onChange={() => setAbschlussWahl('spendenbuch')}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Nur ins Spendenbuch eintragen
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Bestätigung kann später erstellt werden.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  freistellungStatus.status === 'abgelaufen' || !setupStatus.vollstaendig
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
                style={{
                  border: `2px solid ${abschlussWahl === 'bestaetigung' ? 'var(--drk)' : 'var(--border)'}`,
                  background: abschlussWahl === 'bestaetigung' ? 'var(--drk-bg)' : undefined,
                }}
              >
                <input
                  type="radio"
                  name="wizard-abschluss"
                  className="mt-0.5"
                  checked={abschlussWahl === 'bestaetigung'}
                  onChange={() => setAbschlussWahl('bestaetigung')}
                  disabled={freistellungStatus.status === 'abgelaufen' || !setupStatus.vollstaendig}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Sofort Einzelbestätigung erstellen
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    PDF wird generiert und heruntergeladen.
                  </div>
                </div>
              </label>
            </div>

            {/* Setup-Vollständigkeits-Warnung */}
            {!setupStatus.vollstaendig && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fdba74',
                  color: '#9a3412',
                }}
              >
                Einrichtung unvollständig ({setupStatus.fehlendeSchritte.map((s) => s.label).join(', ')}). Bestätigungen können erst nach Abschluss der Einrichtung erstellt werden.
              </div>
            )}

            {/* Freistellung warnings */}
            {freistellungStatus.status === 'abgelaufen' && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error-border)',
                  color: 'var(--error-text)',
                }}
              >
                Freistellungsbescheid abgelaufen. Bestätigungen können erst nach Erneuerung erstellt
                werden.
              </div>
            )}

            {freistellungStatus.status === 'kritisch' && abschlussWahl === 'bestaetigung' && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                }}
              >
                Dringend: Freistellungsbescheid läuft am {freistellungStatus.ablaufDatum} ab (noch{' '}
                {freistellungStatus.restMonate} {freistellungStatus.restMonate === 1 ? 'Monat' : 'Monate'}).
              </div>
            )}

            {freistellungStatus.status === 'warnung' && abschlussWahl === 'bestaetigung' && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                  color: 'var(--warning-text)',
                }}
              >
                Freistellungsbescheid läuft in {freistellungStatus.restMonate} Monaten ab (
                {freistellungStatus.ablaufDatum}).
              </div>
            )}

            {/* Sachspende > 20000 warning */}
            {art === 'sach' && parsedSachWert > 20000 && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                  color: 'var(--warning-text)',
                }}
              >
                Bei Sachspenden über 20.000 € sind zusätzliche Nachweise erforderlich.
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                className="drk-btn-secondary"
                onClick={() => {
                  setError('');
                  setStep(2);
                }}
              >
                Zurück
              </button>
              <button
                type="button"
                className="drk-btn-primary"
                disabled={saving}
                onClick={handleFinish}
              >
                {saving
                  ? 'Wird gespeichert...'
                  : abschlussWahl === 'bestaetigung'
                    ? 'Speichern & Bestätigung erstellen'
                    : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 4: Erfolg                              */}
        {/* ═══════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            {/* Success icon */}
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'var(--success-bg)' }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div>
              <h4 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {bestaetigungErstellt
                  ? 'Zuwendung gespeichert & Bestätigung erstellt!'
                  : 'Zuwendung erfolgreich gespeichert!'}
              </h4>
              <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                {getSpenderDisplayName()} · {effectiveBetrag.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </p>
              {createdSpender && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Neuer Spender wurde angelegt.
                </p>
              )}
            </div>

            {/* Warning if confirmation failed */}
            {bestaetigungWarnung && (
              <div
                className="p-3 rounded-lg text-sm text-left"
                style={{
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                  color: 'var(--warning-text)',
                }}
              >
                Zuwendung wurde gespeichert, aber die Bestätigung konnte nicht erstellt werden:{' '}
                {bestaetigungWarnung}
                <br />
                <Link href="/bestaetigung" className="underline font-semibold mt-1 inline-block">
                  Manuell erstellen
                </Link>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                className="drk-btn-primary w-full"
                onClick={handleReset}
              >
                Weitere Zuwendung erfassen
              </button>
              <div className="flex gap-2">
                <Link
                  href="/spendenbuch"
                  className="drk-btn-secondary flex-1 text-center"
                  onClick={onComplete}
                >
                  Spendenbuch
                </Link>
                <button
                  type="button"
                  className="drk-btn-secondary flex-1"
                  onClick={onComplete}
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
