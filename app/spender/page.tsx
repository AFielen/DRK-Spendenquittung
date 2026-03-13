'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Spender } from '@/lib/types';
import {
  getSpender,
  addSpender,
  updateSpender,
  deleteSpender as deleteSpenderStorage,
  getZuwendungen,
} from '@/lib/storage';
import SpenderTabelle from '@/components/SpenderTabelle';
import SpenderFormular from '@/components/SpenderFormular';
import CsvImport from '@/components/CsvImport';

export default function SpenderPage() {
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<ReturnType<typeof getZuwendungen>>([]);
  const [showFormular, setShowFormular] = useState(false);
  const [editSpender, setEditSpender] = useState<Spender | undefined>();
  const [showCsvImport, setShowCsvImport] = useState(false);
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

  const handleSave = (spender: Spender) => {
    if (editSpender) {
      updateSpender(spender);
    } else {
      addSpender(spender);
    }
    setShowFormular(false);
    setEditSpender(undefined);
    reload();
  };

  const handleEdit = (spender: Spender) => {
    setEditSpender(spender);
    setShowFormular(true);
  };

  const handleDelete = (spender: Spender) => {
    deleteSpenderStorage(spender.id);
    reload();
  };

  const handleCsvImport = (newSpender: Spender[]) => {
    for (const s of newSpender) {
      addSpender(s);
    }
    setShowCsvImport(false);
    reload();
  };

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="drk-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Spenderverwaltung
            </h2>
            <div className="flex gap-2">
              <button
                className="drk-btn-secondary text-sm"
                onClick={() => setShowCsvImport(true)}
              >
                CSV-Import
              </button>
              <button
                className="drk-btn-primary text-sm"
                onClick={() => {
                  setEditSpender(undefined);
                  setShowFormular(true);
                }}
              >
                + Neuer Spender
              </button>
            </div>
          </div>

          <SpenderTabelle
            spender={spenderList}
            zuwendungen={zuwendungen}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showFormular && (
        <SpenderFormular
          spender={editSpender}
          onSave={handleSave}
          onCancel={() => {
            setShowFormular(false);
            setEditSpender(undefined);
          }}
        />
      )}

      {showCsvImport && (
        <CsvImport
          existingSpender={spenderList}
          onImport={handleCsvImport}
          onCancel={() => setShowCsvImport(false)}
        />
      )}
    </div>
  );
}
