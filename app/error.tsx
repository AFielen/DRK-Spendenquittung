'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unbehandelter Fehler:', error);
  }, [error]);

  return (
    <div
      className="min-h-[calc(100vh-theme(spacing.16))] flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="drk-card text-center max-w-md">
        <div className="text-6xl mb-4" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" style={{ color: 'var(--error)' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Ein Fehler ist aufgetreten
        </h2>
        <p className="mb-6" style={{ color: 'var(--text-light)' }}>
          Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="drk-btn-primary">
            Erneut versuchen
          </button>
          <Link href="/" className="drk-btn-secondary inline-flex items-center justify-center">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
