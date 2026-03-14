'use client';

import { useState } from 'react';

interface HilfeHintProps {
  text: string;
}

export default function HilfeHint({ text }: HilfeHintProps) {
  const [open, setOpen] = useState(false);

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
          {/* Mobile: Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 sm:hidden z-40"
            onClick={() => setOpen(false)}
          />
          {/* Mobile: Bottom-Sheet / Desktop: Tooltip */}
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
