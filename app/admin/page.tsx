'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  kreisverband: number;
  nutzer: number;
  spender: number;
  zuwendungen: number;
  zuwendungenSumme: string;
}

interface KvRow {
  id: string;
  slug: string;
  name: string;
  ort: string;
  erstelltAm: string;
  _count: { nutzer: number; spender: number; zuwendungen: number };
  zuwendungenSumme: string;
}

function formatBetrag(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '0,00 €';
  return num.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [kvList, setKvList] = useState<KvRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/kreisverband').then((r) => r.json()),
    ]).then(([s, kv]) => {
      setStats(s);
      setKvList(Array.isArray(kv) ? kv : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Laden...</div>;
  }

  return (
    <>
      {/* Statistik-Karten */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Kreisverbände', value: stats.kreisverband },
            { label: 'Nutzer', value: stats.nutzer },
            { label: 'Spender', value: stats.spender },
            { label: 'Zuwendungen', value: stats.zuwendungen },
            { label: 'Gesamtsumme', value: formatBetrag(stats.zuwendungenSumme) },
          ].map((s) => (
            <div key={s.label} className="drk-card text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--drk)' }}>
                {typeof s.value === 'number' ? s.value.toLocaleString('de-DE') : s.value}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* KV-Tabelle */}
      <div className="drk-card overflow-x-auto">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>Kreisverbände</h2>
        {kvList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Keine Kreisverbände vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Name</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Ort</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Nutzer</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Spender</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Zuwendungen</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Summe</th>
              </tr>
            </thead>
            <tbody>
              {kvList.map((kv) => (
                <tr
                  key={kv.id}
                  className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="py-2.5 px-3">
                    <Link
                      href={`/admin/kreisverband/${kv.id}`}
                      className="font-medium hover:underline"
                      style={{ color: 'var(--drk)' }}
                    >
                      {kv.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3" style={{ color: 'var(--text-light)' }}>{kv.ort}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: 'var(--text)' }}>{kv._count.nutzer}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: 'var(--text)' }}>{kv._count.spender}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: 'var(--text)' }}>{kv._count.zuwendungen}</td>
                  <td className="py-2.5 px-3 text-right font-medium" style={{ color: 'var(--text)' }}>
                    {formatBetrag(kv.zuwendungenSumme)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
