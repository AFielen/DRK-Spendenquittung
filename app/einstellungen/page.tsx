'use client';

import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

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
