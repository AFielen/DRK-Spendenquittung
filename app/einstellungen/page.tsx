'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import { apiDelete } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SettingsCard {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresSchreibrecht: boolean;
}

const SETTINGS_CARDS: SettingsCard[] = [
  {
    href: '/einrichtung',
    title: 'Einrichtung',
    description: 'Vereinsdaten, steuerliche Angaben, Unterschrift und Nutzerverwaltung.',
    requiresSchreibrecht: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    href: '/export',
    title: 'Export',
    description: 'Batch-Export aller Zuwendungsbestätigungen als ZIP mit PDF/DOCX und CSV-Übersicht.',
    requiresSchreibrecht: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    href: '/api-schluessel',
    title: 'API-Schlüssel',
    description: 'REST-API-Zugriff für externe Anwendungen und Agenten verwalten.',
    requiresSchreibrecht: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
];

const CONFIRM_TEXT = 'ALLES LÖSCHEN';

function Gefahrenzone() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmed && confirmInput === CONFIRM_TEXT;

  async function handleDelete() {
    if (!canDelete) return;
    setLoading(true);
    setError('');
    try {
      await apiDelete('/api/einstellungen/gefahrenzone');
      router.push('/');
    } catch {
      setError('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setShowDialog(false);
    setConfirmInput('');
    setConfirmed(false);
    setError('');
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ border: '2px solid var(--drk)', background: 'var(--drk-bg)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--drk)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold" style={{ color: 'var(--drk)' }}>Gefahrenzone</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
            Alle Spender und Zuwendungen unwiderruflich löschen. Vereinsdaten und Benutzer bleiben erhalten.
          </p>
          <button
            className="mt-4 px-4 py-2 rounded-lg font-semibold text-white text-sm"
            style={{ background: 'var(--drk)' }}
            onClick={() => setShowDialog(true)}
          >
            Alle Spender und Zuwendungen löschen
          </button>
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--bg-card)' }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--drk)' }}>
              Alle Daten löschen?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
              Diese Aktion löscht <strong>alle Spender</strong> und <strong>alle Zuwendungen</strong> unwiderruflich.
              Vereinsdaten, Benutzer und API-Schlüssel bleiben erhalten.
            </p>

            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                Ich verstehe, dass alle Spender und Zuwendungen unwiderruflich gelöscht werden.
              </span>
            </label>

            <div className="mb-4">
              <label className="text-sm font-semibold block mb-1" style={{ color: 'var(--text)' }}>
                Geben Sie <span style={{ color: 'var(--drk)' }}>{CONFIRM_TEXT}</span> ein:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="drk-input w-full"
                placeholder={CONFIRM_TEXT}
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm mb-3" style={{ color: 'var(--drk)' }}>{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ color: 'var(--text-light)' }}
                onClick={handleClose}
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--drk)' }}
                onClick={handleDelete}
                disabled={!canDelete || loading}
              >
                {loading ? 'Wird gelöscht…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EinstellungenContent() {
  const { nutzer } = useAuth();
  const isSchreibberechtigt = nutzer?.rolle === 'admin' || nutzer?.rolle === 'schatzmeister';

  const visibleCards = SETTINGS_CARDS.filter(
    (card) => !card.requiresSchreibrecht || isSchreibberechtigt,
  );

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Einstellungen</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
            Vereinsdaten, Export und API-Zugriff verwalten.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="drk-card flex flex-col items-start gap-3 hover:shadow-xl transition-shadow group"
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}
              >
                {card.icon}
              </div>
              <div>
                <h3 className="font-semibold group-hover:underline" style={{ color: 'var(--text)' }}>
                  {card.title}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {isSchreibberechtigt && <Gefahrenzone />}
      </div>
    </div>
  );
}

export default function EinstellungenPage() {
  return (
    <AuthGuard>
      <EinstellungenContent />
    </AuthGuard>
  );
}
