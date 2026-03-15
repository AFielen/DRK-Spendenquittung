'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import Link from 'next/link';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  berechtigungen: string[];
  letzteNutzung: string | null;
  ablaufDatum: string | null;
  erstelltAm: string;
  nutzer: { name: string; email: string };
}

interface CreateResponse {
  id: string;
  name: string;
  prefix: string;
  berechtigungen: string[];
  fullKey: string;
}

const SCOPE_LABELS: Record<string, string> = {
  'spender:read': 'Spender lesen',
  'spender:write': 'Spender bearbeiten',
  'zuwendungen:read': 'Zuwendungen lesen',
  'zuwendungen:write': 'Zuwendungen bearbeiten',
  'kreisverband:read': 'Vereinsdaten lesen',
};

const ALL_SCOPES = Object.keys(SCOPE_LABELS);

function ApiSchluesselContent() {
  const { nutzer } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Formular
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([...ALL_SCOPES]);
  const [ablaufDatum, setAblaufDatum] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSchreibberechtigt = nutzer?.rolle === 'admin' || nutzer?.rolle === 'schatzmeister';

  const loadKeys = useCallback(async () => {
    try {
      const data = await apiGet<ApiKeyItem[]>('/api/api-schluessel');
      setKeys(data);
    } catch {
      // Keine Berechtigung
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiPost<CreateResponse>('/api/api-schluessel', {
        name: name.trim(),
        berechtigungen: scopes,
        ablaufDatum: ablaufDatum || undefined,
      });
      setCreatedKey(res.fullKey);
      setShowCreate(false);
      setName('');
      setScopes([...ALL_SCOPES]);
      setAblaufDatum('');
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('API-Schlüssel wirklich löschen? Alle Anwendungen, die diesen Schlüssel verwenden, verlieren sofort den Zugriff.')) return;
    await apiDelete(`/api/api-schluessel/${id}`);
    await loadKeys();
  }

  function copyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (!isSchreibberechtigt) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="drk-card text-center py-12">
            <p style={{ color: 'var(--text-light)' }}>
              Nur Administratoren und Schatzmeister können API-Schlüssel verwalten.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>API-Schlüssel</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
              Erlauben Sie externen Anwendungen den Zugriff auf Ihre Daten über die REST-API.
            </p>
          </div>
          <button
            className="drk-btn-primary"
            onClick={() => setShowCreate(true)}
          >
            Neuen Schlüssel erstellen
          </button>
        </div>

        {/* Info-Karte */}
        <div className="drk-card" style={{ background: 'var(--drk-bg)', borderLeft: '4px solid var(--drk)' }}>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            API-Schlüssel ermöglichen externen Anwendungen und Agenten den Zugriff auf Spender- und Zuwendungsdaten.
            Die Belegfunktion (PDF/DOCX-Erstellung) ist aus Sicherheitsgründen <strong>nicht</strong> über die API verfügbar.
          </p>
          <p className="text-sm mt-2">
            <Link href="/api-dokumentation" className="font-semibold underline" style={{ color: 'var(--drk)' }}>
              API-Dokumentation ansehen
            </Link>
          </p>
        </div>

        {/* Erstellter Schlüssel Modal */}
        {createdKey && (
          <div className="drk-card" style={{ border: '2px solid var(--success)' }}>
            <div className="flex items-start gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="font-bold mb-2" style={{ color: 'var(--text)' }}>
                  API-Schlüssel erstellt
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
                  Kopieren Sie den Schlüssel jetzt. Er wird <strong>nur einmal</strong> angezeigt und kann nicht wiederhergestellt werden.
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <code className="flex-1 text-sm break-all" style={{ color: 'var(--text)' }}>
                    {createdKey}
                  </code>
                  <button
                    onClick={copyKey}
                    className="drk-btn-secondary text-sm px-3 py-1.5 shrink-0"
                  >
                    {copied ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 text-right">
              <button
                className="text-sm underline"
                style={{ color: 'var(--text-light)' }}
                onClick={() => setCreatedKey(null)}
              >
                Schließen
              </button>
            </div>
          </div>
        )}

        {/* Erstellen-Formular */}
        {showCreate && (
          <div className="drk-card">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
              Neuen API-Schlüssel erstellen
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="drk-label">Name</label>
                <input
                  className="drk-input w-full"
                  placeholder="z.B. Mein CRM-Agent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="drk-label">Berechtigungen</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {ALL_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 p-2 rounded cursor-pointer"
                      style={{ background: scopes.includes(scope) ? 'var(--drk-bg)' : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="accent-red-600"
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        {SCOPE_LABELS[scope]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="drk-label">
                  Ablaufdatum <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <input
                  type="date"
                  className="drk-input"
                  value={ablaufDatum}
                  onChange={(e) => setAblaufDatum(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: 'var(--drk)' }}>{error}</p>
              )}

              <div className="flex gap-3">
                <button type="submit" className="drk-btn-primary" disabled={loading}>
                  {loading ? 'Erstelle...' : 'Schlüssel erstellen'}
                </button>
                <button
                  type="button"
                  className="drk-btn-secondary"
                  onClick={() => { setShowCreate(false); setError(''); }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schlüssel-Liste */}
        <div className="drk-card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            Vorhandene Schlüssel
          </h3>
          {keys.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              Noch keine API-Schlüssel erstellt.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>{key.name}</div>
                    <code className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {key.prefix}...
                    </code>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {key.berechtigungen.map((scope) => (
                        <span
                          key={scope}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}
                        >
                          {SCOPE_LABELS[scope] || scope}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs mt-2 space-x-3" style={{ color: 'var(--text-muted)' }}>
                      <span>Erstellt: {formatDate(key.erstelltAm)}</span>
                      <span>Letzte Nutzung: {formatDate(key.letzteNutzung)}</span>
                      {key.ablaufDatum && <span>Läuft ab: {formatDate(key.ablaufDatum)}</span>}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Erstellt von: {key.nutzer.name}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="text-sm px-3 py-1.5 rounded shrink-0"
                    style={{ color: 'var(--drk)', border: '1px solid var(--drk)' }}
                    title="Schlüssel löschen"
                  >
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApiSchluesselPage() {
  return (
    <AuthGuard>
      <ApiSchluesselContent />
    </AuthGuard>
  );
}
