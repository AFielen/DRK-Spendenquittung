'use client';

import { useEffect, useState } from 'react';
import type { Verein } from '@/lib/types';
import { getVerein } from '@/lib/storage';
import VereinsSetupWizard from '@/components/VereinsSetupWizard';

export default function EinrichtungPage() {
  const [verein, setVereinState] = useState<Verein | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setVereinState(getVerein());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text)' }}>
          {verein ? 'Vereinsdaten bearbeiten' : 'Vereins-Einrichtung'}
        </h2>
        <VereinsSetupWizard existingVerein={verein} />
      </div>
    </div>
  );
}
