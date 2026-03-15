'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface KvDetail {
  id: string;
  name: string;
  slug: string;
  strasse: string;
  plz: string;
  ort: string;
  finanzamt: string;
  steuernummer: string;
  freistellungsart: string;
  freistellungDatum: string;
  unterschriftName: string;
  unterschriftFunktion: string;
  _count: { nutzer: number; spender: number; zuwendungen: number };
  zuwendungenSumme: string;
}

interface Nutzer {
  id: string;
  email: string;
  name: string;
  rolle: string;
  letztesLogin: string | null;
}

interface Spender {
  id: string;
  istFirma: boolean;
  firmenname: string | null;
  vorname: string | null;
  nachname: string;
  ort: string;
  _count: { zuwendungen: number };
}

interface Zuwendung {
  id: string;
  art: string;
  verwendung: string;
  betrag: string;
  datum: string;
  bestaetigungErstellt: boolean;
  laufendeNr: string | null;
  spender: { vorname: string | null; nachname: string; firmenname: string | null; istFirma: boolean };
}

type Tab = 'nutzer' | 'spender' | 'zuwendungen';

function formatBetrag(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '0,00 €';
  return num.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(d: string | null): string {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('de-DE');
}

const ROLLEN = ['admin', 'schatzmeister', 'leser'] as const;

export default function KreisverbandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [kv, setKv] = useState<KvDetail | null>(null);
  const [tab, setTab] = useState<Tab>('nutzer');
  const [nutzer, setNutzer] = useState<Nutzer[]>([]);
  const [spender, setSpender] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/kreisverband/${id}`)
      .then((r) => r.json())
      .then((data) => { setKv(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (tab === 'nutzer') {
      fetch(`/api/admin/kreisverband/${id}/nutzer`).then((r) => r.json()).then((d) => setNutzer(Array.isArray(d) ? d : []));
    } else if (tab === 'spender') {
      fetch(`/api/admin/kreisverband/${id}/spender`).then((r) => r.json()).then((d) => setSpender(Array.isArray(d) ? d : []));
    } else {
      fetch(`/api/admin/kreisverband/${id}/zuwendungen`).then((r) => r.json()).then((d) => setZuwendungen(Array.isArray(d) ? d : []));
    }
  }, [id, tab]);

  async function handleRolleChange(nutzerId: string, rolle: string) {
    const res = await fetch(`/api/admin/nutzer/${nutzerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolle }),
    });
    if (res.ok) {
      setNutzer((prev) => prev.map((n) => (n.id === nutzerId ? { ...n, rolle } : n)));
    }
  }

  async function handleDeleteNutzer(nutzerId: string) {
    if (!confirm('Nutzer wirklich löschen?')) return;
    const res = await fetch(`/api/admin/nutzer/${nutzerId}`, { method: 'DELETE' });
    if (res.ok) {
      setNutzer((prev) => prev.filter((n) => n.id !== nutzerId));
    }
  }

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Laden...</div>;
  if (!kv) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Kreisverband nicht gefunden.</div>;

  return (
    <>
      {/* Breadcrumb */}
      <div className="text-sm" style={{ color: 'var(--text-light)' }}>
        <Link href="/admin" className="hover:underline" style={{ color: 'var(--drk)' }}>Admin</Link>
        {' / '}
        {kv.name}
      </div>

      {/* KV-Info */}
      <div className="drk-card">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>{kv.name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>Adresse</div>
            <div style={{ color: 'var(--text-light)' }}>{kv.strasse}, {kv.plz} {kv.ort}</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>Finanzamt</div>
            <div style={{ color: 'var(--text-light)' }}>{kv.finanzamt}</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>Steuernummer</div>
            <div style={{ color: 'var(--text-light)' }}>{kv.steuernummer}</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>Unterschrift</div>
            <div style={{ color: 'var(--text-light)' }}>{kv.unterschriftName} ({kv.unterschriftFunktion})</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Nutzer', value: kv._count.nutzer },
            { label: 'Spender', value: kv._count.spender },
            { label: 'Zuwendungen', value: kv._count.zuwendungen },
            { label: 'Summe', value: formatBetrag(kv.zuwendungenSumme) },
          ].map((s) => (
            <div key={s.label} className="text-center py-2 rounded-lg" style={{ background: 'var(--bg)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--drk)' }}>
                {typeof s.value === 'number' ? s.value.toLocaleString('de-DE') : s.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="drk-card">
        <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {(['nutzer', 'spender', 'zuwendungen'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 px-4 text-sm transition-colors ${tab === t ? 'font-semibold' : ''}`}
              style={{
                color: tab === t ? 'var(--drk)' : 'var(--text-light)',
                borderBottom: tab === t ? '2px solid var(--drk)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Nutzer-Tab */}
        {tab === 'nutzer' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Name</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>E-Mail</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Rolle</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Letztes Login</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {nutzer.map((n) => (
                <tr key={n.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>{n.name}</td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>{n.email}</td>
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
                      onClick={() => handleDeleteNutzer(n.id)}
                      className="text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--drk)' }}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
              {nutzer.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>Keine Nutzer.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Spender-Tab */}
        {tab === 'spender' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Name</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Ort</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Zuwendungen</th>
              </tr>
            </thead>
            <tbody>
              {spender.map((s) => (
                <tr key={s.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>
                    {s.istFirma ? s.firmenname : `${s.vorname ?? ''} ${s.nachname}`.trim()}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>{s.ort}</td>
                  <td className="py-2 px-3 text-right" style={{ color: 'var(--text)' }}>{s._count.zuwendungen}</td>
                </tr>
              ))}
              {spender.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>Keine Spender.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Zuwendungen-Tab */}
        {tab === 'zuwendungen' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Datum</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Spender</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Art</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Betrag</th>
                <th className="text-center py-2 px-3 font-semibold" style={{ color: 'var(--text)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {zuwendungen.map((z) => (
                <tr key={z.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 px-3" style={{ color: 'var(--text)' }}>{formatDate(z.datum)}</td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>
                    {z.spender.istFirma ? z.spender.firmenname : `${z.spender.vorname ?? ''} ${z.spender.nachname}`.trim()}
                  </td>
                  <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>
                    {z.art === 'geld' ? 'Geld' : 'Sach'} / {z.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag'}
                  </td>
                  <td className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text)' }}>
                    {formatBetrag(z.betrag)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {z.bestaetigungErstellt ? (
                      <span className="drk-badge-success text-xs px-2 py-0.5 rounded-full">Bestätigt</span>
                    ) : (
                      <span className="drk-badge-warning text-xs px-2 py-0.5 rounded-full">Offen</span>
                    )}
                  </td>
                </tr>
              ))}
              {zuwendungen.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>Keine Zuwendungen.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
