'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Kritischer Fehler:', error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          background: '#f8f9fa',
          color: '#212529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '1.25rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '28rem',
            width: '100%',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 1rem' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Kritischer Fehler
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Die Anwendung konnte nicht geladen werden. Bitte versuchen Sie es erneut.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#e30613',
              color: '#fff',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              minHeight: '44px',
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
