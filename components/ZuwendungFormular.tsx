'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface ZuwendungFormularProps {
  spenderList: Spender[];
  zuwendung?: Zuwendung;
  onSave: (zuwendung: Zuwendung) => void;
  onCancel: () => void;
}

export default function ZuwendungFormular({
  spenderList,
  zuwendung,
  onSave,
  onCancel,
}: ZuwendungFormularProps) {
  const [step, setStep] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onCancel);

  const [spenderId, setSpenderId] = useState(zuwendung?.spenderId ?? '');
  const [spenderSuche, setSpenderSuche] = useState(() => {
    if (zuwendung?.spenderId) {
      const s = spenderList.find((sp) => sp.id === zuwendung.spenderId);
      return s ? spenderAnzeigename(s) : '';
    }
    return '';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [art, setArt] = useState<'geld' | 'sach'>(zuwendung?.art ?? 'geld');
  const [verwendung, setVerwendung] = useState<'spende' | 'mitgliedsbeitrag'>(
    zuwendung?.verwendung ?? 'spende'
  );

  // Geld
  const [betrag, setBetrag] = useState(zuwendung?.betrag?.toString() ?? '');
  const [datum, setDatum] = useState(zuwendung?.datum ?? new Date().toISOString().split('T')[0]);
  const [zugangsweg, setZugangsweg] = useState(zuwendung?.zugangsweg ?? '');
  const [verzicht, setVerzicht] = useState(zuwendung?.verzicht ?? false);
  const [bemerkung, setBemerkung] = useState(zuwendung?.bemerkung ?? '');
  const [zweckgebunden, setZweckgebunden] = useState(zuwendung?.zweckgebunden ?? false);
  const [zweckbindung, setZweckbindung] = useState(zuwendung?.zweckbindung ?? '');

  // Sach
  const [sachBezeichnung, setSachBezeichnung] = useState(zuwendung?.sachBezeichnung ?? '');
  const [sachAlter, setSachAlter] = useState(zuwendung?.sachAlter ?? '');
  const [sachZustand, setSachZustand] = useState(zuwendung?.sachZustand ?? '');
  const [sachKaufpreis, setSachKaufpreis] = useState(zuwendung?.sachKaufpreis?.toString() ?? '');
  const [sachWert, setSachWert] = useState(zuwendung?.sachWert?.toString() ?? '');
  const [sachHerkunft, setSachHerkunft] = useState<Zuwendung['sachHerkunft']>(
    zuwendung?.sachHerkunft ?? 'privatvermoegen'
  );
  const [sachBewertungsgrundlage, setSachBewertungsgrundlage] = useState<Zuwendung['sachBewertungsgrundlage']>(
    zuwendung?.sachBewertungsgrundlage ?? null
  );
  const [sachWertermittlung, setSachWertermittlung] = useState(zuwendung?.sachWertermittlung ?? '');
  const [sachEntnahmewert, setSachEntnahmewert] = useState(
    zuwendung?.sachEntnahmewert?.toString() ?? ''
  );
  const [sachUmsatzsteuer, setSachUmsatzsteuer] = useState(
    zuwendung?.sachUmsatzsteuer?.toString() ?? ''
  );
  const [sachUnterlagenVorhanden, setSachUnterlagenVorhanden] = useState(
    zuwendung?.sachUnterlagenVorhanden ?? false
  );

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));
  const fieldError = (field: string, value: string) =>
    touched[field] && value.trim().length === 0;
  const numFieldError = (field: string, value: number) =>
    touched[field] && value <= 0;

  const filteredSpender = useMemo(() => {
    if (!spenderSuche) return spenderList;
    const q = spenderSuche.toLowerCase();
    return spenderList.filter(
      (s) => spenderAnzeigename(s).toLowerCase().includes(q) || (s.firmenname && s.firmenname.toLowerCase().includes(q)) || s.ort.toLowerCase().includes(q)
    );
  }, [spenderList, spenderSuche]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const selectSpender = useCallback((s: Spender) => {
    setSpenderId(s.id);
    setSpenderSuche(spenderAnzeigename(s));
    setDropdownOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const handleSpenderKeyDown = useCallback((e: React.KeyboardEvent) => {
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
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredSpender.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
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
  }, [dropdownOpen, highlightedIndex, filteredSpender, selectSpender]);

  const selectedSpender = spenderList.find((s) => s.id === spenderId);
  const parsedBetrag = parseFloat(betrag) || 0;
  const parsedSachWert = parseFloat(sachWert) || 0;
  const effectiveBetrag = art === 'sach' ? parsedSachWert : parsedBetrag;

  const totalSteps = art === 'sach' ? 3 : 2;

  // Validation per step
  const canProceedStep1 = art === 'geld'
    ? !!(spenderId && datum && parsedBetrag > 0)
    : !!(spenderId && datum && sachBezeichnung.trim() && parsedSachWert > 0);

  const canProceedStep2Sach = sachUnterlagenVorhanden;

  const canSave =
    spenderId &&
    datum &&
    (art === 'geld'
      ? parsedBetrag > 0
      : sachBezeichnung.trim() && parsedSachWert > 0 && sachUnterlagenVorhanden);

  const handleSubmit = () => {
    if (!canSave) return;

    const now = new Date().toISOString();
    const saved: Zuwendung = {
      id: zuwendung?.id ?? crypto.randomUUID(),
      spenderId,
      art,
      verwendung,
      betrag: art === 'geld' ? parsedBetrag : parsedSachWert,
      datum,
      zugangsweg: art === 'geld' && zugangsweg ? (zugangsweg as Zuwendung['zugangsweg']) : undefined,
      verzicht,
      bemerkung: bemerkung.trim() || undefined,
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
      zweckgebunden,
      zweckbindung: zweckgebunden ? zweckbindung.trim() : undefined,
      zweckVerwendet: zuwendung?.zweckVerwendet ?? false,
      zweckVerwendetDatum: zuwendung?.zweckVerwendetDatum,
      zweckVerwendetNotiz: zuwendung?.zweckVerwendetNotiz,
      bestaetigungErstellt: zuwendung?.bestaetigungErstellt ?? false,
      bestaetigungDatum: zuwendung?.bestaetigungDatum,
      bestaetigungTyp: zuwendung?.bestaetigungTyp,
      laufendeNr: zuwendung?.laufendeNr,
      erstelltAm: zuwendung?.erstelltAm ?? now,
      aktualisiertAm: now,
    };
    onSave(saved);
  };

  // Step labels for indicator
  const stepLabels = art === 'sach'
    ? ['Grunddaten', 'Bewertung', 'Abschluss']
    : ['Grunddaten', 'Abschluss'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="zf-dialog-title"
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="zf-dialog-title" className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            {zuwendung ? 'Zuwendung bearbeiten' : 'Neue Zuwendung'}
          </h3>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {step}/{totalSteps}
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-6">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className="h-1 rounded-full transition-colors"
                style={{ background: i + 1 <= step ? 'var(--drk)' : 'var(--border)' }}
              />
              <div className="text-xs mt-1 text-center" style={{ color: i + 1 === step ? 'var(--drk)' : 'var(--text-muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 1: Grunddaten                         */}
        {/* ═══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Spender */}
            <div ref={dropdownRef} className="relative">
              <label className="drk-label">Spender *</label>
              <input
                ref={inputRef}
                type="text"
                className="drk-input"
                placeholder="Spender suchen..."
                role="combobox"
                aria-expanded={dropdownOpen}
                aria-controls="spender-listbox"
                aria-autocomplete="list"
                aria-activedescendant={highlightedIndex >= 0 ? `spender-option-${highlightedIndex}` : undefined}
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
                  id="spender-listbox"
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
                        id={`spender-option-${i}`}
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
                        <span style={{ color: 'var(--text-muted)' }}>({s.plz} {s.ort})</span>
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

            {/* Art-Toggle */}
            <fieldset>
              <legend className="drk-label">Art der Zuwendung</legend>
              <div className="flex gap-0 mt-1" role="radiogroup">
                <button
                  type="button"
                  role="radio"
                  aria-checked={art === 'geld'}
                  className="flex-1 py-2 px-4 text-sm font-semibold rounded-l-lg transition-colors"
                  style={{
                    background: art === 'geld' ? 'var(--drk)' : 'var(--bg)',
                    color: art === 'geld' ? '#fff' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => { setArt('geld'); setStep(1); }}
                >
                  Geldspende
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={art === 'sach'}
                  className="flex-1 py-2 px-4 text-sm font-semibold rounded-r-lg transition-colors"
                  style={{
                    background: art === 'sach' ? 'var(--drk)' : 'var(--bg)',
                    color: art === 'sach' ? '#fff' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => { setArt('sach'); setStep(1); }}
                >
                  Sachspende
                </button>
              </div>
            </fieldset>

            {art === 'geld' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label" htmlFor="zf-betrag">Betrag (€) *</label>
                    <input
                      id="zf-betrag"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`drk-input ${numFieldError('betrag', parsedBetrag) ? 'drk-input-error' : ''}`}
                      value={betrag}
                      onChange={(e) => setBetrag(e.target.value)}
                      onBlur={() => markTouched('betrag')}
                      aria-required="true"
                      aria-invalid={numFieldError('betrag', parsedBetrag) || undefined}
                    />
                    {numFieldError('betrag', parsedBetrag) && (
                      <div className="drk-field-error">Bitte Betrag eingeben</div>
                    )}
                  </div>
                  <div>
                    <label className="drk-label" htmlFor="zf-datum">Datum *</label>
                    <input
                      id="zf-datum"
                      type="date"
                      className={`drk-input ${fieldError('datum', datum) ? 'drk-input-error' : ''}`}
                      value={datum}
                      onChange={(e) => setDatum(e.target.value)}
                      onBlur={() => markTouched('datum')}
                      aria-required="true"
                      aria-invalid={fieldError('datum', datum) || undefined}
                    />
                    {fieldError('datum', datum) && (
                      <div className="drk-field-error">Pflichtfeld</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="drk-label">Zugangsweg (optional)</label>
                  <select className="drk-input" value={zugangsweg} onChange={(e) => setZugangsweg(e.target.value)}>
                    <option value="">– Keine Angabe –</option>
                    <option value="ueberweisung">Überweisung</option>
                    <option value="bar">Bareinzahlung</option>
                    <option value="online">Online-Spende</option>
                    <option value="lastschrift">Lastschrift</option>
                    <option value="paypal">PayPal</option>
                    <option value="scheck">Scheck</option>
                    <option value="sonstig">Sonstig</option>
                  </select>
                  {!zugangsweg && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Für das Spendenbuch empfohlen: Bitte den Zugangsweg angeben.
                    </div>
                  )}
                </div>

                <fieldset>
                  <legend className="drk-label">Verwendung</legend>
                  <div className="flex gap-4 mt-1" role="radiogroup">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="verwendung" checked={verwendung === 'spende'} onChange={() => setVerwendung('spende')} />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>Spende</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="verwendung" checked={verwendung === 'mitgliedsbeitrag'} onChange={() => setVerwendung('mitgliedsbeitrag')} />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>Beitrag</span>
                    </label>
                  </div>
                </fieldset>
              </>
            ) : (
              <>
                <div>
                  <label className="drk-label" htmlFor="zf-sachbez">Bezeichnung des Gegenstands *</label>
                  <input
                    id="zf-sachbez"
                    type="text"
                    className={`drk-input ${fieldError('sachBezeichnung', sachBezeichnung) ? 'drk-input-error' : ''}`}
                    value={sachBezeichnung}
                    onChange={(e) => setSachBezeichnung(e.target.value)}
                    onBlur={() => markTouched('sachBezeichnung')}
                    placeholder="z.B. Laptop Dell Latitude 5520"
                    aria-required="true"
                    aria-invalid={fieldError('sachBezeichnung', sachBezeichnung) || undefined}
                  />
                  {fieldError('sachBezeichnung', sachBezeichnung) && (
                    <div className="drk-field-error">Pflichtfeld</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label" htmlFor="zf-sachalter">Alter</label>
                    <input id="zf-sachalter" type="text" className="drk-input" value={sachAlter} onChange={(e) => setSachAlter(e.target.value)} placeholder="z.B. ca. 3 Jahre" />
                  </div>
                  <div>
                    <label className="drk-label" htmlFor="zf-sachzustand">Zustand</label>
                    <input id="zf-sachzustand" type="text" className="drk-input" value={sachZustand} onChange={(e) => setSachZustand(e.target.value)} placeholder="z.B. gut erhalten" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label" htmlFor="zf-sachkp">Kaufpreis (€, optional)</label>
                    <input id="zf-sachkp" type="number" step="0.01" className="drk-input" value={sachKaufpreis} onChange={(e) => setSachKaufpreis(e.target.value)} />
                  </div>
                  <div>
                    <label className="drk-label" htmlFor="zf-sachwert">Wert (€) *</label>
                    <input
                      id="zf-sachwert"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={`drk-input ${numFieldError('sachWert', parsedSachWert) ? 'drk-input-error' : ''}`}
                      value={sachWert}
                      onChange={(e) => setSachWert(e.target.value)}
                      onBlur={() => markTouched('sachWert')}
                      aria-required="true"
                      aria-invalid={numFieldError('sachWert', parsedSachWert) || undefined}
                    />
                    {numFieldError('sachWert', parsedSachWert) && (
                      <div className="drk-field-error">Bitte Wert eingeben</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="drk-label" htmlFor="zf-sachdatum">Datum *</label>
                  <input
                    id="zf-sachdatum"
                    type="date"
                    className={`drk-input ${fieldError('datum', datum) ? 'drk-input-error' : ''}`}
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                    onBlur={() => markTouched('datum')}
                    aria-required="true"
                    aria-invalid={fieldError('datum', datum) || undefined}
                  />
                  {fieldError('datum', datum) && (
                    <div className="drk-field-error">Pflichtfeld</div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" className="drk-btn-secondary" onClick={onCancel}>Abbrechen</button>
              <button type="button" className="drk-btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 2 (Geld): Abschluss                   */}
        {/* STEP 2 (Sach): Bewertung                    */}
        {/* ═══════════════════════════════════════════ */}
        {step === 2 && art === 'geld' && (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={verzicht} onChange={(e) => setVerzicht(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>Verzicht auf Erstattung von Aufwendungen</span>
              </label>
            </div>

            {verzicht && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
                Ein Aufwandsverzicht ist nur steuerlich abziehbar, wenn der Anspruch auf Erstattung VOR der Tätigkeit rechtswirksam eingeräumt wurde und der Verzicht zeitnah erfolgt.
              </div>
            )}

            <div>
              <label className="drk-label">Bemerkung (intern, optional)</label>
              <textarea className="drk-input" rows={2} value={bemerkung} onChange={(e) => setBemerkung(e.target.value)} placeholder="z.B. für die Jugendarbeit, Katastrophenhilfe..." />
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Nur für Ihre interne Verwaltung — erscheint nicht auf der Spendenquittung.</div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={zweckgebunden} onChange={(e) => setZweckgebunden(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>Diese Zuwendung ist zweckgebunden</span>
              </label>
              {zweckgebunden && (
                <div className="mt-2">
                  <input type="text" className="drk-input" value={zweckbindung} onChange={(e) => setZweckbindung(e.target.value)} placeholder="z.B. für die Jugendarbeit, Katastrophenhilfe, Kleiderkammer..." />
                  {!zweckbindung.trim() && (
                    <div className="text-xs mt-1" style={{ color: 'var(--error)' }}>Bitte geben Sie den Zweck an.</div>
                  )}
                </div>
              )}
            </div>

            {effectiveBetrag > 0 && effectiveBetrag <= 300 && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', color: 'var(--info-text)' }}>
                Für Zuwendungen bis 300 € kann der Spender den Spendenabzug auch mit einem Kontoauszug + vereinfachtem Nachweis belegen.
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" className="drk-btn-secondary" onClick={() => setStep(1)}>← Zurück</button>
              <button type="button" className="drk-btn-primary" disabled={!canSave} onClick={handleSubmit}>Speichern</button>
            </div>
          </div>
        )}

        {step === 2 && art === 'sach' && (
          <div className="space-y-4">
            <fieldset>
              <legend className="drk-label">Herkunft</legend>
              <div className="space-y-2 mt-1" role="radiogroup">
                {([['privatvermoegen', 'Privatvermögen'], ['betriebsvermoegen', 'Betriebsvermögen'], ['keine_angabe', 'Keine Angabe des Zuwendenden']] as const).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="herkunft" checked={sachHerkunft === value} onChange={() => setSachHerkunft(value)} />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {sachHerkunft === 'betriebsvermoegen' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label">Entnahmewert (€)</label>
                    <input type="number" step="0.01" className="drk-input" value={sachEntnahmewert} onChange={(e) => setSachEntnahmewert(e.target.value)} />
                  </div>
                  <div>
                    <label className="drk-label">Umsatzsteuer (€)</label>
                    <input type="number" step="0.01" className="drk-input" value={sachUmsatzsteuer} onChange={(e) => setSachUmsatzsteuer(e.target.value)} />
                  </div>
                </div>
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
                  Bei Sachspenden aus dem Betriebsvermögen ist zwingend eine Rechnung des Spenders erforderlich.
                </div>
              </>
            )}

            <fieldset>
              <legend className="drk-label">Bewertungsgrundlage</legend>
              <div className="space-y-2 mt-1" role="radiogroup">
                {([['rechnung', 'Originalrechnung / Kaufbeleg vorhanden'], ['eigene_ermittlung', 'Eigene Wertermittlung (Vergleichsrecherche)'], ['gutachten', 'Gutachten / Sachverständiger']] as const).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="bewertungsgrundlage" checked={sachBewertungsgrundlage === value} onChange={() => setSachBewertungsgrundlage(value)} />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {sachBewertungsgrundlage === 'eigene_ermittlung' ? (
              <>
                <div>
                  <label className="drk-label">Bewertungsnotiz</label>
                  <textarea className="drk-input" rows={2} value={sachWertermittlung} onChange={(e) => setSachWertermittlung(e.target.value)} placeholder="z.B. Vergleich mit eBay-Kleinanzeigen, Mittelwert aus 3 Angeboten: 250-320€" />
                </div>
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', color: 'var(--info-text)' }}>
                  Dokumentieren Sie Ihre Recherche so, dass das Finanzamt die Wertfindung nachvollziehen kann.
                </div>
              </>
            ) : (
              <div>
                <label className="drk-label">Unterlagen zur Wertermittlung</label>
                <input type="text" className="drk-input" value={sachWertermittlung} onChange={(e) => setSachWertermittlung(e.target.value)} placeholder="z.B. Rechnung vom 15.03.2024" />
              </div>
            )}

            {sachKaufpreis && parsedSachWert > 0 && parsedSachWert > (parseFloat(sachKaufpreis) || 0) && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
                Der angesetzte Wert übersteigt den historischen Kaufpreis. Bitte prüfen.
              </div>
            )}
            {parsedSachWert > 5000 && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
                Bei Werten über 5.000 € empfiehlt sich die Einholung eines Sachverständigengutachtens.
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sachUnterlagenVorhanden} onChange={(e) => setSachUnterlagenVorhanden(e.target.checked)} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Geeignete Unterlagen zur Wertermittlung liegen vor *</span>
              </label>
              {!sachUnterlagenVorhanden && (
                <div className="text-xs mt-1" style={{ color: 'var(--error)' }}>Diese Bestätigung ist Pflicht, um die Zuwendung speichern zu können.</div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" className="drk-btn-secondary" onClick={() => setStep(1)}>← Zurück</button>
              <button type="button" className="drk-btn-primary" disabled={!canProceedStep2Sach} onClick={() => setStep(3)}>Weiter →</button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* STEP 3 (Sach): Abschluss                    */}
        {/* ═══════════════════════════════════════════ */}
        {step === 3 && art === 'sach' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', color: 'var(--info-text)' }}>
              Die Wertermittlungsunterlagen müssen dem Doppel der Zuwendungsbestätigung in Ihrer Vereinsakte zwingend beigefügt werden (BMF Nr. 6).
            </div>

            <div>
              <label className="drk-label">Bemerkung (intern, optional)</label>
              <textarea className="drk-input" rows={2} value={bemerkung} onChange={(e) => setBemerkung(e.target.value)} placeholder="z.B. für die Jugendarbeit, Katastrophenhilfe..." />
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Nur für Ihre interne Verwaltung — erscheint nicht auf der Spendenquittung.</div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={zweckgebunden} onChange={(e) => setZweckgebunden(e.target.checked)} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>Diese Zuwendung ist zweckgebunden</span>
              </label>
              {zweckgebunden && (
                <div className="mt-2">
                  <input type="text" className="drk-input" value={zweckbindung} onChange={(e) => setZweckbindung(e.target.value)} placeholder="z.B. für die Jugendarbeit, Katastrophenhilfe, Kleiderkammer..." />
                  {!zweckbindung.trim() && (
                    <div className="text-xs mt-1" style={{ color: 'var(--error)' }}>Bitte geben Sie den Zweck an.</div>
                  )}
                </div>
              )}
            </div>

            {/* Zusammenfassung */}
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Zusammenfassung</div>
              <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                {selectedSpender ? spenderAnzeigename(selectedSpender) : '–'} · Sachspende · {parsedSachWert.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {sachBezeichnung} · {datum}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" className="drk-btn-secondary" onClick={() => setStep(2)}>← Zurück</button>
              <button type="button" className="drk-btn-primary" disabled={!canSave} onClick={handleSubmit}>Speichern</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
