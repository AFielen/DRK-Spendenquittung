'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Spendenbuch from '@/components/Spendenbuch';
import type { Zuwendung } from '@/lib/types';
import { apiGet } from '@/lib/api-client';

function SpendenbuchContent() {
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await apiGet<Zuwendung[]>('/api/zuwendungen');
      setZuwendungen(
        data.map((z) => ({
          ...z,
          betrag: Number(z.betrag),
          sachWert: z.sachWert != null ? Number(z.sachWert) : undefined,
          sachKaufpreis: z.sachKaufpreis != null ? Number(z.sachKaufpreis) : undefined,
        }))
      );
    } catch {
      // Fehler werden im api-client behandelt
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!loaded) return null;

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Spendenbuch
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
            Chronologisches Journal aller Zuwendungen — sortiert nach Eingangsdatum.
          </p>
        </div>
        <Spendenbuch zuwendungen={zuwendungen} />
      </div>
    </div>
  );
}

export default function SpendenbuchPage() {
  return (
    <AuthGuard>
      <SpendenbuchContent />
    </AuthGuard>
  );
}
