'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import VereinsSetupWizard from '@/components/VereinsSetupWizard';
import type { Verein } from '@/lib/types';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';

interface NutzerItem {
  id: string;
  email: string;
  name: string;
  rolle: string;
  letztesLogin: string | null;
}

function EinrichtungContent() {
  const { kreisverband, nutzer, refresh } = useAuth();
  const [tab, setTab] = useState<'verein' | 'nutzer'>('verein');

  // Nutzer-Verwaltung
  const [nutzerList, setNutzerList] = useState<NutzerItem[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRolle, setNewRolle] = useState('schatzmeister');
  const [inviteError, setInviteError] = useState('');

  const isAdmin = nutzer?.rolle === 'admin';

  const loadNutzer = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiGet<NutzerItem[]>('/api/nutzer');
      setNutzerList(data);
    } catch {
      // Kein Admin
    }
  }, [isAdmin]);

  useEffect(() => {
    loadNutzer();
  }, [loadNutzer]);

  if (!kreisverband) return null;

  const verein: Verein = {
    ...kreisverband,
    freistellungsart: kreisverband.freistellungsart as Verein['freistellungsart'],
  };

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    try {
      await apiPost('/api/nutzer', { email: newEmail, name: newName, rolle: newRolle });
      setNewEmail('');
      setNewName('');
      setNewRolle('schatzmeister');
      await loadNutzer();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Fehler beim Einladen.');
    }
  }

  async function handleRemoveNutzer(id: string) {
    if (!confirm('Nutzer wirklich entfernen?')) return;
    await apiDelete('/api/nutzer', { id });
    await loadNutzer();
  }

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--text)' }}>
          Einrichtung
        </h2>

        {/* Tabs (nur wenn Admin) */}
        {isAdmin && (
          <div className="flex gap-0 justify-center max-w-md mx-auto">
            <button
              className="flex-1 py-2 px-4 text-sm font-semibold"
              style={{
                background: tab === 'verein' ? 'var(--drk)' : 'var(--bg-card)',
                color: tab === 'verein' ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem 0 0 0.5rem',
              }}
              onClick={() => setTab('verein')}
            >
              Vereinsdaten
            </button>
            <button
              className="flex-1 py-2 px-4 text-sm font-semibold"
              style={{
                background: tab === 'nutzer' ? 'var(--drk)' : 'var(--bg-card)',
                color: tab === 'nutzer' ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0 0.5rem 0.5rem 0',
              }}
              onClick={() => setTab('nutzer')}
            >
              Nutzer verwalten
            </button>
          </div>
        )}

        {tab === 'verein' && (
          isAdmin ? (
            <VereinsSetupWizard existingVerein={verein} onSaved={refresh} />
          ) : (
            <div className="drk-card">
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                Nur Administratoren können die Vereinsdaten bearbeiten. Kontaktieren Sie Ihren Admin.
              </p>
              <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--text)' }}>
                <div><strong>Verein:</strong> {kreisverband.name}</div>
                <div><strong>Adresse:</strong> {kreisverband.strasse}, {kreisverband.plz} {kreisverband.ort}</div>
                <div><strong>Finanzamt:</strong> {kreisverband.finanzamt}</div>
                <div><strong>Steuernummer:</strong> {kreisverband.steuernummer}</div>
              </div>
            </div>
          )
        )}

        {tab === 'nutzer' && isAdmin && (
          <div className="space-y-6">
            {/* Nutzer einladen */}
            <div className="drk-card">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
                Neuen Nutzer einladen
              </h3>
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label">Name</label>
                    <input className="drk-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="drk-label">E-Mail</label>
                    <input type="email" className="drk-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="drk-label">Rolle</label>
                  <select className="drk-input" value={newRolle} onChange={(e) => setNewRolle(e.target.value)}>
                    <option value="admin">Administrator</option>
                    <option value="schatzmeister">Schatzmeister</option>
                    <option value="leser">Leser</option>
                  </select>
                </div>
                {inviteError && (
                  <div className="text-sm p-2 rounded" style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}>{inviteError}</div>
                )}
                <button type="submit" className="drk-btn-primary">Nutzer einladen</button>
              </form>
            </div>

            {/* Bestehende Nutzer */}
            <div className="drk-card">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
                Aktive Nutzer
              </h3>
              <div className="space-y-3">
                {nutzerList.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{n.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-light)' }}>{n.email}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {n.rolle === 'admin' ? 'Administrator' : n.rolle === 'schatzmeister' ? 'Schatzmeister' : 'Leser'}
                        {n.letztesLogin && ` · Letzter Login: ${new Date(n.letztesLogin).toLocaleDateString('de-DE')}`}
                      </div>
                    </div>
                    {n.id !== nutzer?.id && (
                      <button
                        className="text-sm underline"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleRemoveNutzer(n.id)}
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EinrichtungPage() {
  return <AuthGuard><EinrichtungContent /></AuthGuard>;
}
