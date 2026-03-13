'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { saveAs } from 'file-saver';
import {
  getSpender,
  getZuwendungen,
  getSettings,
  updateSettings,
  exportAllData,
  importAllData,
  clearAllData,
} from '@/lib/storage';
import type { Zuwendung } from '@/lib/types';
import BackupStatusAnzeige from '@/components/BackupStatusAnzeige';
import StatistikKarten from '@/components/StatistikKarten';

export default function DatenPage() {
  const [spenderCount, setSpenderCount] = useState(0);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [settings, setSettingsState] = useState(getSettings());
  const [loaded, setLoaded] = useState(false);

  // Import
  const [importResult, setImportResult] = useState<{ spender: number; zuwendungen: number; neu: number } | null>(null);

  // Löschen
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteInput, setDeleteInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    setSpenderCount(getSpender().length);
    setZuwendungen(getZuwendungen());
    setSettingsState(getSettings());
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  if (!loaded) return null;

  const handleBackup = () => {
    const data = exportAllData();
    const datum = new Date().toISOString().split('T')[0];
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, `drk-spendenquittung-backup-${datum}.json`);
    updateSettings({ letztesBackup: new Date().toISOString() });
    reload();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = importAllData(reader.result as string);
        setImportResult(result);
        reload();
      } catch {
        alert('Fehler beim Import: Ungültiges JSON-Format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = () => {
    if (deleteInput !== 'LÖSCHEN') return;
    clearAllData();
    setDeleteStep(0);
    setDeleteInput('');
    reload();
    window.location.href = '/';
  };

  const hasRecentBackup = settings.letztesBackup
    ? (new Date().getTime() - new Date(settings.letztesBackup).getTime()) < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Sektion 1 — Backup */}
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            Backup
          </h2>

          <BackupStatusAnzeige settings={settings} />

          <div className="flex flex-wrap gap-3 mt-4">
            <button className="drk-btn-primary" onClick={handleBackup}>
              JSON-Backup erstellen
            </button>
            <button
              className="drk-btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              JSON-Backup importieren
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {importResult && (
            <div
              className="mt-4 p-3 rounded-lg text-sm"
              style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}
            >
              Import abgeschlossen: {importResult.spender} Spender, {importResult.zuwendungen} Zuwendungen
              gefunden. {importResult.neu} davon neu.
            </div>
          )}
        </div>

        {/* Sektion 2 — Statistik */}
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            Statistik
          </h2>
          <StatistikKarten spenderCount={spenderCount} zuwendungen={zuwendungen} />
        </div>

        {/* Sektion 3 — Gefahrenzone */}
        <div className="drk-card" style={{ border: '1px solid #fca5a5' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#991b1b' }}>
            Gefahrenzone
          </h2>

          {deleteStep === 0 && (
            <button
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
              onClick={() => setDeleteStep(1)}
            >
              Alle Daten löschen
            </button>
          )}

          {deleteStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-bold" style={{ color: '#991b1b' }}>
                Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              {!hasRecentBackup && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}
                >
                  ⚠️ Sie haben kein aktuelles Backup. Bitte erstellen Sie zuerst einen Export.
                  <button
                    className="drk-btn-secondary text-sm mt-2 block"
                    onClick={handleBackup}
                  >
                    Backup erstellen
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-lg font-semibold text-sm"
                  style={{ background: '#dc2626', color: '#fff' }}
                  onClick={() => setDeleteStep(2)}
                >
                  Ja, fortfahren
                </button>
                <button className="drk-btn-secondary" onClick={() => setDeleteStep(0)}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: '#991b1b' }}>
                Bitte geben Sie <strong>LÖSCHEN</strong> ein, um zu bestätigen.
              </p>
              <input
                type="text"
                className="drk-input"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="LÖSCHEN"
              />
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-lg font-semibold text-sm"
                  style={{ background: '#dc2626', color: '#fff' }}
                  disabled={deleteInput !== 'LÖSCHEN'}
                  onClick={handleDelete}
                >
                  Endgültig löschen
                </button>
                <button
                  className="drk-btn-secondary"
                  onClick={() => {
                    setDeleteStep(0);
                    setDeleteInput('');
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
