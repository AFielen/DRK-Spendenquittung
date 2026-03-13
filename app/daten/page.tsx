'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import type { Zuwendung } from '@/lib/types';
import { apiGet, apiDelete } from '@/lib/api-client';
import StatistikKarten from '@/components/StatistikKarten';

function DatenContent() {
  const { nutzer } = useAuth();
  const [spenderCount, setSpenderCount] = useState(0);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);

  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteInput, setDeleteInput] = useState('');

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

  const isAdmin = nutzer?.rolle === 'admin';

  const handleDelete = async () => {
    if (deleteInput !== 'LÖSCHEN') return;
    // Alle Spender löschen (CASCADE löscht auch Zuwendungen)
    const spender = await apiGet<{ id: string }[]>('/api/spender');
    for (const s of spender) {
      await apiDelete(`/api/spender/${s.id}`, { confirm: true });
    }
    setDeleteStep(0);
    setDeleteInput('');
    await reload();
  };

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

        <div className="drk-card">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Datenspeicherung
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>
            Alle Daten werden in einer PostgreSQL-Datenbank auf einem Hetzner-Server in Deutschland gespeichert.
            Die Daten sind nicht an einen Browser gebunden — Sie können sich von jedem Gerät einloggen.
            Backups werden serverseitig erstellt.
          </p>
        </div>

        {/* Gefahrenzone (nur Admin) */}
        {isAdmin && (
          <div className="drk-card" style={{ border: '1px solid #fca5a5' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#991b1b' }}>
              Gefahrenzone
            </h2>

            {deleteStep === 0 && (
              <button
                className="px-4 py-2 rounded-lg font-semibold text-sm"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
                onClick={() => setDeleteStep(1)}
              >
                Alle Spender und Zuwendungen löschen
              </button>
            )}

            {deleteStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-bold" style={{ color: '#991b1b' }}>
                  Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-lg font-semibold text-sm"
                    style={{ background: '#dc2626', color: '#fff' }}
                    onClick={() => setDeleteStep(2)}
                  >
                    Ja, fortfahren
                  </button>
                  <button className="drk-btn-secondary" onClick={() => setDeleteStep(0)}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: '#991b1b' }}>
                  Bitte geben Sie <strong>LÖSCHEN</strong> ein, um zu bestätigen.
                </p>
                <input
                  type="text"
                  className="drk-input"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="LÖSCHEN"
                />
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-lg font-semibold text-sm"
                    style={{ background: '#dc2626', color: '#fff' }}
                    disabled={deleteInput !== 'LÖSCHEN'}
                    onClick={handleDelete}
                  >
                    Endgültig löschen
                  </button>
                  <button className="drk-btn-secondary" onClick={() => { setDeleteStep(0); setDeleteInput(''); }}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DatenPage() {
  return <AuthGuard><DatenContent /></AuthGuard>;
}
