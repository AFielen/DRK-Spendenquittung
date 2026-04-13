'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getEintragById } from '@/lib/hilfe-content';

interface HilfeHintProps {
  text: string;
  faqId?: string;
  beispiel?: string;
}

export default function HilfeHint({ text, faqId, beispiel }: HilfeHintProps) {
  const [open, setOpen] = useState(false);

  const faqEintrag = faqId ? getEintragById(faqId) : undefined;

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-colors"
        style={{
          background: open ? 'var(--drk)' : 'var(--border)',
          color: open ? '#fff' : 'var(--text-light)',
        }}
        aria-label="Hilfe anzeigen"
      >
        ?
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/20 sm:hidden z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:left-0 sm:right-auto sm:top-7 z-50 sm:w-72 p-4 sm:p-3 rounded-t-xl sm:rounded-lg text-sm shadow-lg drk-sheet-enter sm:drk-fade-in"
            style={{
              background: 'var(--info-bg)',
              border: '1px solid #93c5fd',
              color: 'var(--text)',
            }}
          >
            <div className="font-semibold mb-1 sm:hidden" style={{ color: 'var(--text)' }}>
              Hilfe
            </div>
            {text}

            {beispiel && (
              <div
                className="mt-2 px-2 py-1 rounded text-xs"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
              >
                {beispiel}
              </div>
            )}

            {faqEintrag && (
              <Link
                href={`/hilfe?q=${encodeURIComponent(faqEintrag.frage)}`}
                className="block mt-2 text-xs font-semibold hover:underline"
                style={{ color: 'var(--drk)' }}
                onClick={() => setOpen(false)}
              >
                Mehr dazu in der Hilfe →
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="block mt-2 text-xs underline"
              style={{ color: 'var(--text-light)' }}
            >
              Schließen
            </button>
          </div>
        </>
      )}
    </span>
  );
}
