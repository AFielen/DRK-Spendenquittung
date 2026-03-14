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
        <div
          className="absolute left-0 top-7 z-10 w-72 p-3 rounded-lg text-sm shadow-lg"
          style={{
            background: 'var(--info-bg)',
            border: '1px solid #93c5fd',
            color: 'var(--text)',
          }}
        >
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
      )}
    </span>
  );
}
