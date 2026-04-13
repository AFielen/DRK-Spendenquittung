'use client';

import { useState, useRef } from 'react';
import type { Spender } from '@/lib/types';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface SpenderFormularProps {
  spender?: Spender;
  onSave: (spender: Spender) => void;
  onCancel: () => void;
}

export default function SpenderFormular({ spender, onSave, onCancel }: SpenderFormularProps) {
  const [istFirma, setIstFirma] = useState(spender?.istFirma ?? false);
  const [firmenname, setFirmenname] = useState(spender?.firmenname ?? '');
  const [anrede, setAnrede] = useState<Spender['anrede']>(spender?.anrede ?? '');
  const [vorname, setVorname] = useState(spender?.vorname ?? '');
  const [nachname, setNachname] = useState(spender?.nachname ?? '');
  const [strasse, setStrasse] = useState(spender?.strasse ?? '');
  const [plz, setPlz] = useState(spender?.plz ?? '');
  const [ort, setOrt] = useState(spender?.ort ?? '');
  const [steuerIdNr, setSteuerIdNr] = useState(spender?.steuerIdNr ?? '');
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onCancel);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const fieldError = (field: string, value: string) =>
    touched[field] && value.trim().length === 0;

  const canSave = istFirma
    ? firmenname.trim().length > 0 &&
      strasse.trim().length > 0 &&
      plz.trim().length > 0 &&
      ort.trim().length > 0
    : vorname.trim().length > 0 &&
      nachname.trim().length > 0 &&
      strasse.trim().length > 0 &&
      plz.trim().length > 0 &&
      ort.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const now = new Date().toISOString();
    const saved: Spender = {
      id: spender?.id ?? crypto.randomUUID(),
      istFirma,
      firmenname: istFirma ? firmenname.trim() : undefined,
      anrede: istFirma ? undefined : anrede || undefined,
      vorname: istFirma ? (vorname.trim() || undefined) : vorname.trim(),
      nachname: istFirma ? (nachname.trim() || firmenname.trim()) : nachname.trim(),
      strasse: strasse.trim(),
      plz: plz.trim(),
      ort: ort.trim(),
      steuerIdNr: steuerIdNr.trim() || undefined,
      erstelltAm: spender?.erstelltAm ?? now,
      aktualisiertAm: now,
    };
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sf-dialog-title"
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <h3 id="sf-dialog-title" className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
          {spender ? 'Spender bearbeiten' : 'Neuer Spender'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Spendertyp-Umschalter */}
          <fieldset>
            <legend className="drk-label">Spendertyp</legend>
            <div className="flex gap-0 mt-1" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={!istFirma}
                className="flex-1 py-2 px-3 text-sm font-semibold transition-colors"
                style={{
                  background: !istFirma ? 'var(--drk)' : 'var(--bg)',
                  color: !istFirma ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem 0 0 0.5rem',
                }}
                onClick={() => setIstFirma(false)}
              >
                Privatperson
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={istFirma}
                className="flex-1 py-2 px-3 text-sm font-semibold transition-colors"
                style={{
                  background: istFirma ? 'var(--drk)' : 'var(--bg)',
                  color: istFirma ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '0 0.5rem 0.5rem 0',
                }}
                onClick={() => setIstFirma(true)}
              >
                Firma / Organisation
              </button>
            </div>
          </fieldset>

          {istFirma ? (
            <>
              <div>
                <label className="drk-label" htmlFor="sf-firmenname">Firmenname / Organisation *</label>
                <input
                  id="sf-firmenname"
                  type="text"
                  className={`drk-input ${fieldError('firmenname', firmenname) ? 'drk-input-error' : ''}`}
                  value={firmenname}
                  onChange={(e) => setFirmenname(e.target.value)}
                  onBlur={() => markTouched('firmenname')}
                  placeholder="z.B. Mustermann GmbH"
                  aria-required="true"
                  aria-invalid={fieldError('firmenname', firmenname) || undefined}
                  aria-describedby={fieldError('firmenname', firmenname) ? 'sf-firmenname-err' : undefined}
                />
                {fieldError('firmenname', firmenname) && (
                  <div id="sf-firmenname-err" className="drk-field-error">Pflichtfeld</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="drk-label" htmlFor="sf-vorname-f">Ansprechpartner Vorname</label>
                  <input
                    id="sf-vorname-f"
                    type="text"
                    className="drk-input"
                    value={vorname}
                    onChange={(e) => setVorname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="drk-label" htmlFor="sf-nachname-f">Ansprechpartner Nachname</label>
                  <input
                    id="sf-nachname-f"
                    type="text"
                    className="drk-input"
                    value={nachname}
                    onChange={(e) => setNachname(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="drk-label" htmlFor="sf-anrede">Anrede (optional)</label>
                <select
                  id="sf-anrede"
                  className="drk-input"
                  value={anrede ?? ''}
                  onChange={(e) => setAnrede(e.target.value as Spender['anrede'])}
                >
                  <option value="">– Keine –</option>
                  <option value="Herr">Herr</option>
                  <option value="Frau">Frau</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="drk-label" htmlFor="sf-vorname">Vorname *</label>
                  <input
                    id="sf-vorname"
                    type="text"
                    className={`drk-input ${fieldError('vorname', vorname) ? 'drk-input-error' : ''}`}
                    value={vorname}
                    onChange={(e) => setVorname(e.target.value)}
                    onBlur={() => markTouched('vorname')}
                    aria-required="true"
                    aria-invalid={fieldError('vorname', vorname) || undefined}
                    aria-describedby={fieldError('vorname', vorname) ? 'sf-vorname-err' : undefined}
                  />
                  {fieldError('vorname', vorname) && (
                    <div id="sf-vorname-err" className="drk-field-error">Pflichtfeld</div>
                  )}
                </div>
                <div>
                  <label className="drk-label" htmlFor="sf-nachname">Nachname *</label>
                  <input
                    id="sf-nachname"
                    type="text"
                    className={`drk-input ${fieldError('nachname', nachname) ? 'drk-input-error' : ''}`}
                    value={nachname}
                    onChange={(e) => setNachname(e.target.value)}
                    onBlur={() => markTouched('nachname')}
                    aria-required="true"
                    aria-invalid={fieldError('nachname', nachname) || undefined}
                    aria-describedby={fieldError('nachname', nachname) ? 'sf-nachname-err' : undefined}
                  />
                  {fieldError('nachname', nachname) && (
                    <div id="sf-nachname-err" className="drk-field-error">Pflichtfeld</div>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="drk-label" htmlFor="sf-strasse">Straße *</label>
            <input
              id="sf-strasse"
              type="text"
              className={`drk-input ${fieldError('strasse', strasse) ? 'drk-input-error' : ''}`}
              value={strasse}
              onChange={(e) => setStrasse(e.target.value)}
              onBlur={() => markTouched('strasse')}
              aria-required="true"
              aria-invalid={fieldError('strasse', strasse) || undefined}
              aria-describedby={fieldError('strasse', strasse) ? 'sf-strasse-err' : undefined}
            />
            {fieldError('strasse', strasse) && (
              <div id="sf-strasse-err" className="drk-field-error">Pflichtfeld</div>
            )}
          </div>

          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <div>
              <label className="drk-label" htmlFor="sf-plz">PLZ *</label>
              <input
                id="sf-plz"
                type="text"
                className={`drk-input ${fieldError('plz', plz) ? 'drk-input-error' : ''}`}
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                onBlur={() => markTouched('plz')}
                aria-required="true"
                aria-invalid={fieldError('plz', plz) || undefined}
                aria-describedby={fieldError('plz', plz) ? 'sf-plz-err' : undefined}
              />
              {fieldError('plz', plz) && (
                <div id="sf-plz-err" className="drk-field-error">Pflichtfeld</div>
              )}
            </div>
            <div>
              <label className="drk-label" htmlFor="sf-ort">Ort *</label>
              <input
                id="sf-ort"
                type="text"
                className={`drk-input ${fieldError('ort', ort) ? 'drk-input-error' : ''}`}
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
                onBlur={() => markTouched('ort')}
                aria-required="true"
                aria-invalid={fieldError('ort', ort) || undefined}
                aria-describedby={fieldError('ort', ort) ? 'sf-ort-err' : undefined}
              />
              {fieldError('ort', ort) && (
                <div id="sf-ort-err" className="drk-field-error">Pflichtfeld</div>
              )}
            </div>
          </div>

          <div>
            <label className="drk-label" htmlFor="sf-steuerid">
              {istFirma ? 'Steuernummer (optional)' : 'Steuer-ID (optional, für perspektivische eZB)'}
            </label>
            <input
              id="sf-steuerid"
              type="text"
              className="drk-input"
              value={steuerIdNr}
              onChange={(e) => setSteuerIdNr(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="drk-btn-secondary" onClick={onCancel}>
              Abbrechen
            </button>
            <button type="submit" className="drk-btn-primary" disabled={!canSave}>
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
