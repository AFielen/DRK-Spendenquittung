'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import type { Zuwendung } from '@/lib/types';
import { apiGet } from '@/lib/api-client';
import StatistikKarten from '@/components/StatistikKarten';

function DatenContent() {
  const [spenderCount, setSpenderCount] = useState(0);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);

  const reload = useCallback(async () => {
    const [sp, zw] = await Promise.all([
      apiGet<{ id: string }[]>('/api/spender'),
      apiGet<Zuwendung[]>('/api/zuwendungen'),
    ]);
    setSpenderCount(sp.length);
    setZuwendungen(zw.map((z) => ({ ...z, betrag: Number(z.betrag) })));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Statistik */}
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            Statistik
          </h2>
          <StatistikKarten spenderCount={spenderCount} zuwendungen={zuwendungen} />
        </div>
      </div>
    </div>
  );
}

export default function DatenPage() {
  return <AuthGuard><DatenContent /></AuthGuard>;
}
