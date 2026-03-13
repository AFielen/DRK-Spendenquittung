'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { nutzer, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !nutzer) {
      router.replace('/login');
    }
  }, [loading, nutzer, router]);

  if (loading) {
    return (
      <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="drk-card animate-pulse">
            <div className="h-6 rounded" style={{ background: 'var(--border)', width: '40%' }} />
            <div className="mt-4 space-y-3">
              <div className="h-4 rounded" style={{ background: 'var(--border)' }} />
              <div className="h-4 rounded" style={{ background: 'var(--border)', width: '80%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nutzer) {
    return null;
  }

  return <>{children}</>;
}
