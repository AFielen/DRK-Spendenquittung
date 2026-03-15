'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NutzerRow {
  id: string;
  email: string;
  name: string;
  rolle: string;
  letztesLogin: string | null;
  kreisverband: { id: string; name: string };
}

const ROLLEN = ['admin', 'schatzmeister', 'leser'] as const;

function formatDate(d: string | null): string {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('de-DE');
}

export default function AdminNutzerPage() {
  const [nutzer, setNutzer] = useState<NutzerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/nutzer')
      .then((r) => r.json())
      .then((d) => { setNutzer(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleRolleChange(id: string, rolle: string) {
    const res = await fetch(`/api/admin/nutzer/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolle }),
    });
    if (res.ok) {
      setNutzer((prev) => prev.map((n) => (n.id === id ? { ...n, rolle } : n)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Nutzer wirklich löschen?')) return;
    const res = await fetch(`/api/admin/nutzer/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNutzer((prev) => prev.filter((n) => n.id !== id));
    }
  }

  const filtered = nutzer.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.name.toLowerCase().includes(q) || n.email.toLowerCase().includes(q) || n.kreisverband.name.toLowerCase().includes(q);
  });

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Laden...</div>;

  return (
    <>
      <div className="drk-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Alle Nutzer ({nutzer.length})
          </h2>
          <input
            type="text"
            placeholder="Suche nach Name, E-Mail, KV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="drk-input py-1.5 px-3 text-sm w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Name</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>E-Mail</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Kreisverband</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Rolle</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Letztes Login</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>{n.name}</td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>{n.email}</td>
                  <td className="py-2 px-3">
                    <Link
                      href={`/admin/kreisverband/${n.kreisverband.id}`}
                      className="hover:underline"
                      style={{ color: 'var(--drk)' }}
                    >
                      {n.kreisverband.name}
                    </Link>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={n.rolle}
                      onChange={(e) => handleRolleChange(n.id, e.target.value)}
                      className="drk-input py-1 px-2 text-sm"
                    >
                      {ROLLEN.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>{formatDate(n.letztesLogin)}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--drk)' }}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                    {search ? 'Keine Treffer.' : 'Keine Nutzer vorhanden.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
