'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Zuwendung } from '@/lib/types';
import {
  getSpender,
  getZuwendungen,
  addZuwendung,
  updateZuwendung,
  deleteZuwendung as deleteZuwendungStorage,
} from '@/lib/storage';
import ZuwendungTabelle from '@/components/ZuwendungTabelle';
import ZuwendungFormular from '@/components/ZuwendungFormular';

export default function ZuwendungenPage() {
  const [spenderList, setSpenderList] = useState<ReturnType<typeof getSpender>>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [showFormular, setShowFormular] = useState(false);
  const [editZuwendung, setEditZuwendung] = useState<Zuwendung | undefined>();
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    setSpenderList(getSpender());
    setZuwendungen(getZuwendungen());
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  if (!loaded) return null;

  const handleSave = (zuwendung: Zuwendung) => {
    if (editZuwendung) {
      updateZuwendung(zuwendung);
    } else {
      addZuwendung(zuwendung);
    }
    setShowFormular(false);
    setEditZuwendung(undefined);
    reload();
  };

  const handleEdit = (zuwendung: Zuwendung) => {
    setEditZuwendung(zuwendung);
    setShowFormular(true);
  };

  const handleDelete = (zuwendung: Zuwendung) => {
    deleteZuwendungStorage(zuwendung.id);
    reload();
  };

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
