'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import SpenderTabelle from '@/components/SpenderTabelle';
import SpenderFormular from '@/components/SpenderFormular';
import CsvImport from '@/components/CsvImport';
import type { Spender } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

function SpenderContent() {
  const [spender, setSpender] = useState<Spender[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [editSpender, setEditSpender] = useState<Spender | undefined>();
  const [showArchived, setShowArchived] = useState(false);

  const loadSpender = useCallback(async () => {
    const url = showArchived ? '/api/spender?includeArchived=true' : '/api/spender';
    const data = await apiGet<Spender[]>(url);
    setSpender(data);
  }, [showArchived]);

  useEffect(() => {
    loadSpender();
  }, [loadSpender]);

  async function handleSave(s: Spender) {
    if (editSpender) {
      await apiPut<Spender>(`/api/spender/${editSpender.id}`, s);
    } else {
      await apiPost<Spender>('/api/spender', s);
    }
    setShowForm(false);
    setEditSpender(undefined);
    await loadSpender();
  }

  async function handleDelete(s: Spender) {
    await apiDelete(`/api/spender/${s.id}`);
    await loadSpender();
  }

  function handleEdit(s: Spender) {
    setEditSpender(s);
    setShowForm(true);
  }

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="drk-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 data-tour="spender-titel" className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Spenderverwaltung
            </h2>
            <div className="flex gap-2">
              <button data-tour="btn-csv-import" className="drk-btn-secondary text-sm" onClick={() => setShowCsv(true)}>
                CSV-Import
              </button>
              <button
                data-tour="btn-neuer-spender"
                className="drk-btn-primary text-sm"
                onClick={() => {
                  setEditSpender(undefined);
                  setShowForm(true);
                }}
              >
                + Neuer Spender
              </button>
            </div>
          </div>

          <div data-tour="spender-tabelle">
            <SpenderTabelle
              spender={spender}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showArchived={showArchived}
              onToggleArchived={() => setShowArchived((v) => !v)}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <SpenderFormular
          spender={editSpender}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditSpender(undefined);
          }}
        />
      )}

      {showCsv && (
        <CsvImport
          onImportDone={loadSpender}
          onCancel={() => setShowCsv(false)}
        />
      )}
    </div>
  );
}

export default function SpenderPage() {
  return (
    <AuthGuard>
      <SpenderContent />
    </AuthGuard>
  );
}
