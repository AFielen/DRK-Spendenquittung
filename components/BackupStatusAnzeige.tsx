'use client';

import Link from 'next/link';
import type { AppSettings } from '@/lib/types';

interface BackupStatusAnzeigeProps {
  settings: AppSettings;
}

export default function BackupStatusAnzeige({ settings }: BackupStatusAnzeigeProps) {
  const letztesBackup = settings.letztesBackup ? new Date(settings.letztesBackup) : null;
  const jetzt = new Date();

  let tageHer = letztesBackup
    ? Math.floor((jetzt.getTime() - letztesBackup.getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  if (tageHer === -1 || tageHer > 90) {
    return (
      <div
        className="p-4 rounded-xl"
        style={{ background: '#fef2f2', border: '2px solid #fca5a5' }}
      >
        <div className="text-sm font-bold" style={{ color: '#991b1b' }}>
          ❌ KEIN AKTUELLES BACKUP!
        </div>
        <p className="text-sm mt-1" style={{ color: '#991b1b' }}>
          Bei Verlust der Browserdaten gehen alle Daten und Doppel unwiederbringlich verloren.
        </p>
        <Link href="/daten" className="text-sm underline font-semibold mt-1 inline-block" style={{ color: '#991b1b' }}>
          Jetzt Backup erstellen →
        </Link>
      </div>
    );
  }

  if (tageHer >= 30) {
    return (
      <div
        className="p-4 rounded-xl"
        style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}
      >
        <div className="text-sm font-bold" style={{ color: '#92400e' }}>
          ⚠️ Backup überfällig!
        </div>
        <p className="text-sm mt-1" style={{ color: '#92400e' }}>
          Ihre Daten existieren nur in diesem Browser. Letztes Backup: {tageHer} Tage her.
        </p>
        <Link href="/daten" className="text-sm underline font-semibold mt-1 inline-block" style={{ color: '#92400e' }}>
          Backup erstellen →
        </Link>
      </div>
    );
  }

  const datumStr = letztesBackup!.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
    >
      <div className="text-sm font-bold" style={{ color: '#166534' }}>
        ✅ Letztes Backup: {datumStr}
      </div>
    </div>
  );
}
