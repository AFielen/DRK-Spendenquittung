'use client';

import { useState } from 'react';

interface UnterschriftHinweisProps {
  onDownload: (mitDoppel: boolean) => void;
  onCancel: () => void;
}

export default function UnterschriftHinweis({ onDownload, onCancel }: UnterschriftHinweisProps) {
  const [mitDoppel, setMitDoppel] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-6"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">✍️</div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Unterschrift erforderlich
          </h3>
        </div>

        <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
          Bitte drucken Sie die Zuwendungsbestätigung aus und unterschreiben Sie eigenhändig.
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
          Ohne Unterschrift ist die Bestätigung steuerlich nicht anerkennungsfähig.
        </p>

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={mitDoppel}
            onChange={(e) => setMitDoppel(e.target.checked)}
          />
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            Doppel für Vereinsakte miterzeugen
          </span>
        </label>

        <div className="flex gap-3">
          <button className="drk-btn-secondary flex-1" onClick={onCancel}>
            Abbrechen
          </button>
          <button className="drk-btn-primary flex-1" onClick={() => onDownload(mitDoppel)}>
            Herunterladen
          </button>
        </div>
      </div>
    </div>
  );
}
