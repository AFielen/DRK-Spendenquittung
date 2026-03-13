'use client';

import { useState } from 'react';
import type { Spender } from '@/lib/types';

interface SpenderFormularProps {
  spender?: Spender;
  onSave: (spender: Spender) => void;
  onCancel: () => void;
}

export default function SpenderFormular({ spender, onSave, onCancel }: SpenderFormularProps) {
  const [anrede, setAnrede] = useState<Spender['anrede']>(spender?.anrede ?? '');
  const [vorname, setVorname] = useState(spender?.vorname ?? '');
  const [nachname, setNachname] = useState(spender?.nachname ?? '');
  const [strasse, setStrasse] = useState(spender?.strasse ?? '');
  const [plz, setPlz] = useState(spender?.plz ?? '');
  const [ort, setOrt] = useState(spender?.ort ?? '');
  const [steuerIdNr, setSteuerIdNr] = useState(spender?.steuerIdNr ?? '');

  const canSave =
    vorname.trim().length > 0 &&
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
      anrede: anrede || undefined,
      vorname: vorname.trim(),
      nachname: nachname.trim(),
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

          <div>
            <label className="drk-label">Straße *</label>
            <input
              type="text"
              className="drk-input"
              value={strasse}
              onChange={(e) => setStrasse(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="drk-label">PLZ *</label>
              <input
                type="text"
                className="drk-input"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
              />
            </div>
            <div className="col-span-2">
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
            <label className="drk-label">Steuer-ID (optional, für perspektivische eZB)</label>
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
