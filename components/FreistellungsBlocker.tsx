'use client';

import Link from 'next/link';
import type { Verein } from '@/lib/types';
import { pruefFreistellung } from '@/lib/freistellung-check';

interface FreistellungsBlockerProps {
  verein: Verein;
  blockContent?: boolean; // true = Vollbild-Blocker bei 'abgelaufen'
}

export default function FreistellungsBlocker({ verein, blockContent = false }: FreistellungsBlockerProps) {
  const status = pruefFreistellung(verein);

  if (status.status === 'abgelaufen' && blockContent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-8 px-4">
        <div
          className="max-w-lg p-8 rounded-xl text-center"
          style={{ background: '#fef2f2', border: '2px solid #fca5a5' }}
        >
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#991b1b' }}>
            Ihr Freistellungs-/Feststellungsbescheid ist abgelaufen.
          </h2>
          <p className="mb-4 text-sm" style={{ color: '#991b1b' }}>
            Der Verein darf bei abgelaufenen Bescheiden keine Zuwendungsbestätigungen ausstellen
            (§ 63 Abs. 5 AO).
          </p>
          <p className="mb-6 text-sm" style={{ color: '#7f1d1d' }}>
            Bitte aktualisieren Sie die Bescheiddaten unter Einrichtung.
          </p>
          <Link href="/einrichtung" className="drk-btn-primary inline-block">
            Zur Einrichtung →
          </Link>
        </div>
      </div>
    );
  }

  if (status.status === 'abgelaufen') {
    return (
      <div
        className="p-4 rounded-xl mb-4"
        style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}
      >
        <div className="text-sm font-bold" style={{ color: '#991b1b' }}>
          ❌ Freistellungsbescheid abgelaufen
        </div>
        <p className="text-sm mt-1" style={{ color: '#991b1b' }}>
          Keine Zuwendungsbestätigungen möglich.{' '}
          <Link href="/einrichtung" className="underline font-semibold">
            Bescheiddaten aktualisieren →
          </Link>
        </p>
      </div>
    );
  }

  if (status.status === 'warnung') {
    return (
      <div
        className="p-4 rounded-xl mb-4"
        style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}
      >
        <div className="text-sm font-bold" style={{ color: '#92400e' }}>
          ⚠️ Bescheid läuft am {status.ablaufDatum} ab (noch {status.restMonate} Monate)
        </div>
        <p className="text-sm mt-1" style={{ color: '#92400e' }}>
          Bitte kümmern Sie sich rechtzeitig um die Verlängerung.
        </p>
      </div>
    );
  }

  return null;
}
