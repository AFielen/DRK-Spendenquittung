'use client';

import { useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { getEintraegeForSeite, getTourForSeite } from '@/lib/hilfe-content';

const PUBLIC_PATHS = ['/login', '/impressum', '/datenschutz', '/hilfe', '/spenden', '/registrierung'];

const SEITEN_NAMEN: Record<string, string> = {
  '/': 'Dashboard',
  '/spender': 'Spenderverwaltung',
  '/zuwendungen': 'Zuwendungen',
  '/bestaetigung': 'Bestätigung',
  '/export': 'Export',
  '/einrichtung': 'Einrichtung',
  '/einstellungen': 'Einstellungen',
  '/daten': 'Daten',
  '/api-schluessel': 'API-Schlüssel',
  '/spendenbuch': 'Spendenbuch',
};

interface HilfeDrawerProps {
  onStartTour?: () => void;
}

export default function HilfeDrawer({ onStartTour }: HilfeDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(open ? drawerRef : { current: null }, close);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return null;

  const eintraege = getEintraegeForSeite(pathname);
  const tour = getTourForSeite(pathname);
  const seitenName = SEITEN_NAMEN[pathname] ?? 'diese Seite';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110"
        style={{ background: 'var(--drk)', color: '#fff' }}
        aria-label="Hilfe öffnen"
        title="Hilfe zu dieser Seite"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 drk-backdrop-enter"
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-label="Hilfe-Panel"
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] overflow-y-auto drk-drawer-enter"
            style={{ background: 'var(--bg-card)' }}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Hilfe</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{seitenName}</p>
              </div>
              <button
                onClick={close}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Hilfe schließen"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {tour && onStartTour && (
                <button
                  onClick={() => {
                    close();
                    setTimeout(() => onStartTour(), 250);
                  }}
                  className="w-full drk-btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  Tour starten: {tour.titel}
                </button>
              )}

              {eintraege.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Häufige Fragen</h3>
                  {eintraege.map((eintrag) => (
                    <details key={eintrag.id} className="group">
                      <summary className="drk-summary text-sm">{eintrag.frage}</summary>
                      <div
                        className="mt-2 text-sm pl-4"
                        style={{ color: 'var(--text-light)' }}
                        dangerouslySetInnerHTML={{ __html: eintrag.antwort }}
                      />
                    </details>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Keine seitenspezifische Hilfe verfügbar.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <Link
                  href="/hilfe"
                  onClick={close}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: 'var(--drk)' }}
                >
                  Alle Hilfe-Themen →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
