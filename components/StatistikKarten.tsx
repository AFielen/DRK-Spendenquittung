'use client';

import type { Zuwendung } from '@/lib/types';

interface StatistikKartenProps {
  spenderCount: number;
  zuwendungen: Zuwendung[];
}

export default function StatistikKarten({ spenderCount, zuwendungen }: StatistikKartenProps) {
  const currentYear = new Date().getFullYear();
  const jahresZuwendungen = zuwendungen.filter((z) => z.datum.startsWith(currentYear.toString()));
  const jahresSumme = jahresZuwendungen.reduce(
    (s, z) => s + (z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag),
    0
  );
  const offene = zuwendungen.filter((z) => !z.bestaetigungErstellt).length;

  // Balkendiagramm: letzte 5 Jahre
  const jahreMap: Record<string, number> = {};
  for (let i = 4; i >= 0; i--) {
    jahreMap[(currentYear - i).toString()] = 0;
  }
  for (const z of zuwendungen) {
    const jahr = z.datum.substring(0, 4);
    if (jahreMap[jahr] !== undefined) {
      jahreMap[jahr] += z.art === 'sach' ? (z.sachWert ?? 0) : z.betrag;
    }
  }
  const maxSumme = Math.max(...Object.values(jahreMap), 1);

  const formatBetrag = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{spenderCount}</div>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>Spender</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {formatBetrag(jahresSumme)} €
          </div>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>Zuwendungen {currentYear}</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: offene > 0 ? 'var(--drk)' : 'var(--text)' }}>
            {offene}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>Offene Bestätigungen</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {jahresZuwendungen.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>Zuwendungen (Anzahl)</div>
        </div>
      </div>

      {/* Balkendiagramm */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>
          Zuwendungen pro Jahr
        </div>
        <div className="space-y-2">
          {Object.entries(jahreMap).map(([jahr, summe]) => (
            <div key={jahr} className="flex items-center gap-3">
              <div className="text-xs w-10 text-right" style={{ color: 'var(--text-light)' }}>{jahr}</div>
              <div className="flex-1 h-5 rounded" style={{ background: 'var(--border)' }}>
                <div
                  className="h-5 rounded"
                  style={{
                    background: 'var(--drk)',
                    width: `${Math.max((summe / maxSumme) * 100, summe > 0 ? 2 : 0)}%`,
                  }}
                />
              </div>
              <div className="text-xs w-20 text-right" style={{ color: 'var(--text-light)' }}>
                {formatBetrag(summe)} €
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
