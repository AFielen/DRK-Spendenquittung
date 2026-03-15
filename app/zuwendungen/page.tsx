'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import ZuwendungTabelle from '@/components/ZuwendungTabelle';
import ZuwendungFormular from '@/components/ZuwendungFormular';
import type { Zuwendung, Spender, Verein } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

function ZuwendungenContent() {
  const { kreisverband } = useAuth();
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [showFormular, setShowFormular] = useState(false);
  const [editZuwendung, setEditZuwendung] = useState<Zuwendung | undefined>();

  const reload = useCallback(async () => {
    const [sp, zw] = await Promise.all([
      apiGet<Spender[]>('/api/spender'),
      apiGet<Zuwendung[]>('/api/zuwendungen'),
    ]);
    setSpenderList(sp);
    setZuwendungen(zw.map((z) => ({ ...z, betrag: Number(z.betrag) })));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSave(zuwendung: Zuwendung) {
    if (editZuwendung) {
      await apiPut(`/api/zuwendungen/${editZuwendung.id}`, zuwendung);
    } else {
      await apiPost('/api/zuwendungen', zuwendung);
    }
    setShowFormular(false);
    setEditZuwendung(undefined);
    await reload();
  }

  function handleEdit(zuwendung: Zuwendung) {
    setEditZuwendung(zuwendung);
    setShowFormular(true);
  }

  async function handleDelete(zuwendung: Zuwendung) {
    await apiDelete(`/api/zuwendungen/${zuwendung.id}`);
    await reload();
  }

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="drk-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Zuwendungen
            </h2>
            <button
              className="drk-btn-primary text-sm"
              onClick={() => {
                setEditZuwendung(undefined);
                setShowFormular(true);
              }}
            >
              + Neue Zuwendung
            </button>
          </div>

          <ZuwendungTabelle
            zuwendungen={zuwendungen}
            spenderList={spenderList}
            verein={kreisverband ? { ...kreisverband, freistellungsart: kreisverband.freistellungsart as Verein['freistellungsart'] } : undefined}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showFormular && (
        <ZuwendungFormular
          spenderList={spenderList}
          zuwendung={editZuwendung}
          onSave={handleSave}
          onCancel={() => {
            setShowFormular(false);
            setEditZuwendung(undefined);
          }}
        />
      )}
    </div>
  );
}

export default function ZuwendungenPage() {
  return (
    <AuthGuard>
      <ZuwendungenContent />
    </AuthGuard>
  );
}
