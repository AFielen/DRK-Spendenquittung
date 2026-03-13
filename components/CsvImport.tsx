'use client';

import { useState, useCallback } from 'react';
import type { Spender } from '@/lib/types';

interface CsvImportProps {
  existingSpender: Spender[];
  onImport: (newSpender: Spender[]) => void;
  onCancel: () => void;
}

interface ParseResult {
  neue: Spender[];
  duplikate: number;
  fehler: string[];
}

function parseCSV(text: string, existing: Spender[]): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { neue: [], duplikate: 0, fehler: ['Datei ist leer.'] };

  // Trenner erkennen
  const firstLine = lines[0];
  const trenner = firstLine.includes(';') ? ';' : ',';

  // Header überspringen
  const dataLines = lines.slice(1);

  const neue: Spender[] = [];
  let duplikate = 0;
  const fehler: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const cols = dataLines[i].split(trenner).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 5) {
      fehler.push(`Zeile ${i + 2}: Zu wenige Spalten (${cols.length} statt 5)`);
      continue;
    }

    const [vorname, nachname, strasse, plz, ort] = cols;
    if (!vorname || !nachname || !strasse || !plz || !ort) {
      fehler.push(`Zeile ${i + 2}: Pflichtfeld fehlt`);
      continue;
    }

    // Duplikat-Prüfung
    const isDuplicate =
      existing.some(
        (s) =>
          s.vorname.toLowerCase() === vorname.toLowerCase() &&
          s.nachname.toLowerCase() === nachname.toLowerCase() &&
          s.plz === plz
      ) ||
      neue.some(
        (s) =>
          s.vorname.toLowerCase() === vorname.toLowerCase() &&
          s.nachname.toLowerCase() === nachname.toLowerCase() &&
          s.plz === plz
      );

    if (isDuplicate) {
      duplikate++;
      continue;
    }

    const now = new Date().toISOString();
    neue.push({
      id: crypto.randomUUID(),
      vorname,
      nachname,
      strasse,
      plz,
      ort,
      erstelltAm: now,
      aktualisiertAm: now,
      sachUnterlagenVorhanden: false,
    } as unknown as Spender);
  }

  return { neue, duplikate, fehler };
}

export default function CsvImport({ existingSpender, onImport, onCancel }: CsvImportProps) {
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setResult(parseCSV(text, existingSpender));
      };
      reader.readAsText(file, 'utf-8');
    },
    [existingSpender]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
          CSV-Import
        </h3>

        <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
          Erwartetes Format: <code>Vorname;Nachname;Straße;PLZ;Ort</code> (Semikolon oder Komma als
          Trenner). Erste Zeile wird als Header übersprungen.
        </p>

        <input type="file" accept=".csv" onChange={handleFile} className="drk-input mb-4" />

        {result && (
          <div className="space-y-3">
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: 'var(--drk-bg)', color: 'var(--text)' }}
            >
              <strong>{result.neue.length}</strong> neue Spender gefunden
              {result.duplikate > 0 && (
                <>, <strong>{result.duplikate}</strong> Duplikate übersprungen</>
              )}
            </div>

            {result.fehler.length > 0 && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ background: '#fef2f2', color: '#991b1b' }}
              >
                {result.fehler.map((f, i) => (
                  <div key={i}>{f}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button className="drk-btn-secondary" onClick={onCancel}>
                Abbrechen
              </button>
              <button
                className="drk-btn-primary"
                disabled={result.neue.length === 0}
                onClick={() => onImport(result.neue)}
              >
                {result.neue.length} Spender importieren
              </button>
            </div>
          </div>
        )}

        {!result && (
          <div className="flex justify-end">
            <button className="drk-btn-secondary" onClick={onCancel}>
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
