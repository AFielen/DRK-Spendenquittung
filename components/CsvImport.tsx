'use client';

import { useState, useCallback } from 'react';
import { apiPost } from '@/lib/api-client';
import HilfeHint from './HilfeHint';

interface CsvImportProps {
  onImportDone: () => void;
  onCancel: () => void;
}

interface ImportResult {
  erstellt: number;
  duplikate: number;
  fehler: string[];
}

export default function CsvImport({ onImportDone, onCancel }: CsvImportProps) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(reader.result as string);
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  async function handleImport() {
    if (!csvText.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await apiPost<ImportResult>('/api/spender/import', { csv: csvText });
      setResult(res);
      if (res.erstellt > 0) {
        onImportDone();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 drk-backdrop-enter"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-lg drk-sheet-enter max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            CSV-Import
          </h3>

          {!result && (
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
                CSV-Datei mit den Spalten: Vorname, Nachname, Strasse, PLZ, Ort
                (optional: Anrede, SteuerIdNr). Trennzeichen: Semikolon oder Komma.
              </p>

              <div className="mb-3">
                <HilfeHint text="CSV mit Semikolon oder Komma als Trennzeichen. Pflicht: Vorname, Nachname, Strasse, PLZ, Ort." faqId="csv-import" beispiel="Vorname;Nachname;Strasse;PLZ;Ort" />
              </div>

              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFile}
                className="drk-input mb-3"
              />

              {csvText && (
                <div className="text-xs mb-3 p-2 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                  {csvText.split('\n').length - 1} Datenzeilen erkannt
                </div>
              )}

              {error && (
                <div className="text-sm mb-3 p-2 rounded" style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="drk-btn-primary flex-1"
                  onClick={handleImport}
                  disabled={!csvText.trim() || loading}
                >
                  {loading ? 'Importiere...' : 'Importieren'}
                </button>
                <button className="drk-btn-secondary" onClick={onCancel}>
                  Abbrechen
                </button>
              </div>
            </>
          )}

          {result && (
            <>
              <div className="space-y-2 mb-4">
                <div className="text-sm" style={{ color: 'var(--success)' }}>
                  {result.erstellt} Spender importiert
                </div>
                {result.duplikate > 0 && (
                  <div className="text-sm" style={{ color: 'var(--warning-dark)' }}>
                    {result.duplikate} Duplikate übersprungen
                  </div>
                )}
                {result.fehler.length > 0 && (
                  <div className="text-sm" style={{ color: 'var(--drk)' }}>
                    {result.fehler.map((f, i) => (
                      <div key={i}>{f}</div>
                    ))}
                  </div>
                )}
              </div>
              <button className="drk-btn-primary w-full" onClick={onCancel}>
                Schließen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
