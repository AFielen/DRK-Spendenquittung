'use client';

import { useState } from 'react';
import type { Spender } from '@/lib/types';

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
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
          {spender ? 'Spender bearbeiten' : 'Neuer Spender'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Spendertyp-Umschalter */}
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
                onClick={() => setIstFirma(false)}
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
                onClick={() => setIstFirma(true)}
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
                  onChange={(e) => setFirmenname(e.target.value)}
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
                    onChange={(e) => setVorname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="drk-label">Ansprechpartner Nachname</label>
                  <input
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
                <label className="drk-label">Anrede (optional)</label>
                <select
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
                  <label className="drk-label">Vorname *</label>
                  <input
                    type="text"
                    className="drk-input"
                    value={vorname}
                    onChange={(e) => setVorname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="drk-label">Nachname *</label>
                  <input
                    type="text"
                    className="drk-input"
                    value={nachname}
                    onChange={(e) => setNachname(e.target.value)}
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
              onChange={(e) => setStrasse(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <div>
              <label className="drk-label">PLZ *</label>
              <input
                type="text"
                className="drk-input"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
              />
            </div>
            <div>
              <label className="drk-label">Ort *</label>
              <input
                type="text"
                className="drk-input"
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="drk-label">
              {istFirma ? 'Steuernummer (optional)' : 'Steuer-ID (optional, für perspektivische eZB)'}
            </label>
            <input
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
