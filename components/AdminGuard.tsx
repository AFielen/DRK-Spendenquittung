'use client';

import { useAuth } from './AuthProvider';
import { ReactNode } from 'react';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { nutzer, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
        Laden...
      </div>
    );
  }

  if (!nutzer) {
    return (
      <div className="py-16 text-center">
        <div className="drk-card max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Nicht angemeldet</h2>
          <p style={{ color: 'var(--text-light)' }}>Bitte melden Sie sich an.</p>
        </div>
      </div>
    );
  }

  if (!nutzer.isSuperadmin) {
    return (
      <div className="py-16 text-center">
        <div className="drk-card max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Kein Zugriff</h2>
          <p style={{ color: 'var(--text-light)' }}>
            Dieser Bereich ist nur für Systemadministratoren zugänglich.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
