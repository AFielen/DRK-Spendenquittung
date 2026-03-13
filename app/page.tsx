'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Verein, Zuwendung } from '@/lib/types';
import { getVerein, getSpender, getZuwendungen, getSettings } from '@/lib/storage';
import FreistellungsBlocker from '@/components/FreistellungsBlocker';
import BackupStatusAnzeige from '@/components/BackupStatusAnzeige';
import StatistikKarten from '@/components/StatistikKarten';

export default function Home() {
  const [verein, setVereinState] = useState<Verein | null>(null);
  const [spenderCount, setSpenderCount] = useState(0);
  const [zuwendungen, setZuwendungenState] = useState<Zuwendung[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setVereinState(getVerein());
    setSpenderCount(getSpender().length);
    setZuwendungenState(getZuwendungen());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // Zustand 1 — Erststart
  if (!verein) {
    return (
      <div className="min-h-[calc(100vh-200px)] py-8 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="drk-card drk-fade-in text-center">
            <div className="p-3 rounded-xl inline-block mb-4" style={{ background: 'var(--drk-bg)' }}>
              <span className="text-4xl" aria-hidden="true">🧾</span>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
              Willkommen bei DRK Spendenquittung
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-light)' }}>
              Erstellen Sie Zuwendungsbestätigungen nach den verbindlichen BMF-Mustern — direkt
              im Browser, ohne Server, DSGVO-konform.
            </p>
            <Link href="/einrichtung" className="drk-btn-primary inline-block">
              Jetzt einrichten →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Zustand 2 — Verein konfiguriert, keine Spender
  if (spenderCount === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] py-8 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          <FreistellungsBlocker verein={verein} />
          <div className="drk-card drk-fade-in">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Hallo, {verein.name}
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-light)' }}>
              Legen Sie Ihren ersten Spender an, um Zuwendungsbestätigungen zu erstellen.
            </p>
            <Link href="/spender" className="drk-btn-primary inline-block">
              Spender anlegen →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Zustand 3 — Regulärer Betrieb
  const settings = getSettings();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const letzterExport = settings.letzterBatchExport ? new Date(settings.letzterBatchExport) : null;
  const vorjahrExportiert = letzterExport
    ? letzterExport.getFullYear() >= currentYear - 1
    : false;

  return (
    <div className="min-h-[calc(100vh-200px)] py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Ampel-Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FreistellungsBlocker verein={verein} />
          <BackupStatusAnzeige settings={settings} />
        </div>

        {/* Jahresabschluss-Erinnerung */}
        {currentMonth >= 11 && (
          <div
            className="p-4 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}
          >
            <div className="text-sm font-bold" style={{ color: '#92400e' }}>
              ⚠️ Jahresabschluss-Export für {currentYear} empfohlen
            </div>
            <Link
              href="/export"
              className="text-sm underline mt-1 inline-block"
              style={{ color: '#92400e' }}
            >
              Export starten →
            </Link>
          </div>
        )}
        {currentMonth >= 2 && !vorjahrExportiert && (
          <div
            className="p-4 rounded-xl"
            style={{ background: '#fef2f2', border: '2px solid #fca5a5' }}
          >
            <div className="text-sm font-bold" style={{ color: '#991b1b' }}>
              ❌ Jahresabschluss {currentYear - 1} noch nicht erstellt!
            </div>
            <Link
              href="/export"
              className="text-sm underline mt-1 inline-block"
              style={{ color: '#991b1b' }}
            >
              Jetzt exportieren →
            </Link>
          </div>
        )}

        {/* Statistik-Karten */}
        <StatistikKarten spenderCount={spenderCount} zuwendungen={zuwendungen} />

        {/* Schnellzugriff */}
        <div className="drk-card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            Schnellzugriff
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link
              href="/zuwendungen"
              className="p-3 rounded-lg text-center text-sm font-semibold transition-colors hover:shadow-md"
              style={{ background: 'var(--drk)', color: '#fff' }}
            >
              Neue Zuwendung
            </Link>
            <Link
              href="/bestaetigung"
              className="p-3 rounded-lg text-center text-sm font-semibold transition-colors hover:shadow-md"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Einzelbestätigung
            </Link>
            <Link
              href="/bestaetigung"
              className="p-3 rounded-lg text-center text-sm font-semibold transition-colors hover:shadow-md"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Sammelbestätigung
            </Link>
            <Link
              href="/export"
              className="p-3 rounded-lg text-center text-sm font-semibold transition-colors hover:shadow-md"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Jahresexport
            </Link>
            <Link
              href="/daten"
              className="p-3 rounded-lg text-center text-sm font-semibold transition-colors hover:shadow-md"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Backup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
