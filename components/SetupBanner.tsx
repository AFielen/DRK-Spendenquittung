'use client';

import Link from 'next/link';
import type { Verein } from '@/lib/types';
import { pruefSetupVollstaendigkeit } from '@/lib/setup-check';

interface SetupBannerProps {
  verein: Verein;
  blockContent?: boolean;
}

export default function SetupBanner({ verein, blockContent = false }: SetupBannerProps) {
  const status = pruefSetupVollstaendigkeit(verein);

  if (status.vollstaendig) return null;

  if (blockContent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-8 px-4">
        <div
          className="max-w-lg p-8 rounded-xl text-center"
          style={{ background: '#fef2f2', border: '2px solid #fca5a5' }}
        >
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#991b1b' }}>
            Einrichtung unvollständig
          </h2>
          <p className="mb-4 text-sm" style={{ color: '#991b1b' }}>
            Bevor Sie Zuwendungsbestätigungen erstellen können, müssen alle Pflichtdaten
            ausgefüllt sein.
          </p>
          <div className="mb-4 text-left">
            {status.fehlendeSchritte.map((s) => (
              <div key={s.schritt} className="text-sm mb-2" style={{ color: '#7f1d1d' }}>
                <span className="font-semibold">Schritt {s.schritt} – {s.label}:</span>{' '}
                {s.felder.join(', ')}
              </div>
            ))}
          </div>
          <p className="text-xs mb-6" style={{ color: '#7f1d1d' }}>
            {status.fortschritt.abgeschlossen} von {status.fortschritt.gesamt} Schritten abgeschlossen
          </p>
          <Link href="/einrichtung" className="drk-btn-primary inline-block">
            Setup vervollständigen →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-xl mb-4"
      style={{ background: '#fff7ed', border: '1px solid #fdba74' }}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0">⚙️</div>
        <div className="flex-1">
          <div className="text-sm font-bold mb-1" style={{ color: '#9a3412' }}>
            Einrichtung unvollständig – {status.fortschritt.abgeschlossen} von {status.fortschritt.gesamt} Schritten abgeschlossen
          </div>
          <div className="text-sm mb-2" style={{ color: '#9a3412' }}>
            {status.fehlendeSchritte.map((s) => (
              <span key={s.schritt}>
                {s.label} ({s.felder.join(', ')}){' '}
              </span>
            ))}
          </div>
          <Link
            href="/einrichtung"
            className="text-sm font-semibold underline"
            style={{ color: '#9a3412' }}
          >
            Setup vervollständigen →
          </Link>
        </div>
      </div>
    </div>
  );
}
