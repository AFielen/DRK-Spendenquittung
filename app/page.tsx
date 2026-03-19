'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import AuthGuard from '@/components/AuthGuard';
import FreistellungsBlocker from '@/components/FreistellungsBlocker';
import SetupBanner from '@/components/SetupBanner';
import StatistikKarten from '@/components/StatistikKarten';
import ZweckbindungsStatus from '@/components/ZweckbindungsStatus';
import Fristwarnung from '@/components/Fristwarnung';
import SpendeWizard from '@/components/SpendeWizard';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { pruefSetupVollstaendigkeit } from '@/lib/setup-check';
import { apiGet } from '@/lib/api-client';

function DashboardContent() {
  const { kreisverband } = useAuth();
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [spenderData, zuwendungenData] = await Promise.all([
        apiGet<Spender[]>('/api/spender'),
        apiGet<Zuwendung[]>('/api/zuwendungen'),
      ]);
      setSpenderList(spenderData);
      setZuwendungen(zuwendungenData.map((z) => ({
        ...z,
        betrag: Number(z.betrag),
        sachWert: z.sachWert != null ? Number(z.sachWert) : undefined,
      })));
    } catch {
      // Fehler werden im api-client behandelt
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!loaded || !kreisverband) return null;

  const verein: Verein = {
    ...kreisverband,
    freistellungsart: kreisverband.freistellungsart as Verein['freistellungsart'],
    unterschriftName: kreisverband.unterschriftName,
    unterschriftFunktion: kreisverband.unterschriftFunktion,
  };

  const setupStatus = pruefSetupVollstaendigkeit(verein);

  // Wenn noch keine Spender vorhanden
  if (spenderList.length === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] py-8 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          <SetupBanner verein={verein} />
          <FreistellungsBlocker verein={verein} />
          <div className="drk-card drk-fade-in">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Hallo, {kreisverband.name}
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

  // Regulärer Betrieb
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <div className="min-h-[calc(100vh-200px)] py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Setup-Vollständigkeit */}
        <SetupBanner verein={verein} />

        {/* Freistellungs-Status */}
        <FreistellungsBlocker verein={verein} />

        {/* Jahresabschluss-Erinnerung */}
        {currentMonth >= 11 && (
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--warning-bg)', border: '1px solid #fcd34d' }}
          >
            <div className="text-sm font-bold" style={{ color: 'var(--warning-dark)' }}>
              Jahresabschluss-Export für {currentYear} empfohlen
            </div>
            <Link
              href="/export"
              className="text-sm underline mt-1 inline-block"
              style={{ color: 'var(--warning-dark)' }}
            >
              Export starten →
            </Link>
          </div>
        )}

        {/* Statistik-Karten */}
        <StatistikKarten spenderCount={spenderList.length} zuwendungen={zuwendungen} />

        {/* Zweckbindungs-Status */}
        <ZweckbindungsStatus zuwendungen={zuwendungen} onUpdate={reload} />

        {/* Fristüberwachung */}
        <Fristwarnung zuwendungen={zuwendungen} />

        {/* Schnellzugriff */}
        <div className="drk-card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            Schnellzugriff
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => setShowWizard(true)}
              className="p-3 rounded-lg text-center text-sm font-semibold transition-colors hover:shadow-md"
              style={{
                background: setupStatus.vollstaendig ? 'var(--drk)' : 'var(--border)',
                color: setupStatus.vollstaendig ? '#fff' : 'var(--text-muted)',
                cursor: setupStatus.vollstaendig ? 'pointer' : 'not-allowed',
              }}
              disabled={!setupStatus.vollstaendig}
              title={!setupStatus.vollstaendig ? 'Einrichtung muss erst abgeschlossen werden' : undefined}
            >
              Neue Spende
            </button>
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
              Statistik
            </Link>
          </div>
        </div>
      </div>

      {showWizard && (
        <SpendeWizard
          spenderList={spenderList}
          verein={verein}
          onComplete={() => { setShowWizard(false); reload(); }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
