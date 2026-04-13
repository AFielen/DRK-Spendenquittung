'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { hilfeEintraege, kategorien, type HilfeKategorie } from '@/lib/hilfe-content';
import { fuzzySearch } from '@/lib/fuzzy-search';

function KategorieIcon({ path }: { path: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export default function Hilfe() {
  const searchParams = useSearchParams();
  const [suchbegriff, setSuchbegriff] = useState(searchParams.get('q') ?? '');
  const [aktiveKategorie, setAktiveKategorie] = useState<HilfeKategorie | null>(
    (searchParams.get('kategorie') as HilfeKategorie) ?? null,
  );

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSuchbegriff(q);
    const k = searchParams.get('kategorie') as HilfeKategorie | null;
    if (k) setAktiveKategorie(k);
  }, [searchParams]);

  const suchergebnisse = useMemo(() => {
    if (suchbegriff.trim().length < 2) return null;
    const results = fuzzySearch(suchbegriff, hilfeEintraege);
    const matchIds = new Set(results.map((r) => r.id));
    return hilfeEintraege.filter((e) => matchIds.has(e.id));
  }, [suchbegriff]);

  const angezeigeEintraege = suchergebnisse
    ?? hilfeEintraege.filter((e) => !aktiveKategorie || e.kategorie === aktiveKategorie);

  const eintraegeProKategorie = useMemo(() => {
    const map = new Map<HilfeKategorie, typeof hilfeEintraege>();
    for (const eintrag of angezeigeEintraege) {
      const list = map.get(eintrag.kategorie) ?? [];
      list.push(eintrag);
      map.set(eintrag.kategorie, list);
    }
    return map;
  }, [angezeigeEintraege]);

  function handleKategorieClick(id: HilfeKategorie) {
    setSuchbegriff('');
    setAktiveKategorie((prev) => (prev === id ? null : id));
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Hilfe & Anleitung
          </h2>
          <p style={{ color: 'var(--text-light)' }}>
            Antworten auf häufige Fragen rund um Zuwendungsbestätigungen und die App.
          </p>
        </div>

        {/* Search */}
        <div className="drk-card">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="drk-input pl-10"
              placeholder="Suchen... (z.B. Freistellung, CSV-Import, Unterschrift)"
              value={suchbegriff}
              onChange={(e) => {
                setSuchbegriff(e.target.value);
                if (e.target.value) setAktiveKategorie(null);
              }}
              aria-label="FAQ durchsuchen"
            />
          </div>
          {suchergebnisse !== null && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {suchergebnisse.length === 0
                ? `Keine Ergebnisse für „${suchbegriff}"`
                : `${suchergebnisse.length} Ergebnis${suchergebnisse.length !== 1 ? 'se' : ''} für „${suchbegriff}"`}
            </p>
          )}
        </div>

        {/* Category Cards */}
        {!suchergebnisse && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {kategorien.map((kat) => {
              const count = hilfeEintraege.filter((e) => e.kategorie === kat.id).length;
              const isActive = aktiveKategorie === kat.id;
              return (
                <button
                  key={kat.id}
                  onClick={() => handleKategorieClick(kat.id)}
                  className="drk-card text-left transition-all hover:shadow-xl cursor-pointer p-4"
                  style={{
                    borderLeft: isActive ? '3px solid var(--drk)' : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: isActive ? 'var(--drk)' : 'var(--text-light)' }}>
                      <KategorieIcon path={kat.icon} />
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {kat.titel}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {kat.beschreibung} · {count} {count === 1 ? 'Frage' : 'Fragen'}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ Sections */}
        {kategorien
          .filter((kat) => eintraegeProKategorie.has(kat.id))
          .map((kat) => (
            <div key={kat.id} className="drk-card" id={`kategorie-${kat.id}`}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: 'var(--drk)' }}>
                  <KategorieIcon path={kat.icon} />
                </span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  {kat.titel}
                </h3>
              </div>
              <div className="space-y-3">
                {eintraegeProKategorie.get(kat.id)!.map((eintrag) => (
                  <details key={eintrag.id} className="group" id={`faq-${eintrag.id}`}>
                    <summary className="drk-summary">{eintrag.frage}</summary>
                    <div
                      className="mt-2 text-sm pl-4"
                      style={{ color: 'var(--text-light)' }}
                      dangerouslySetInnerHTML={{ __html: eintrag.antwort }}
                    />
                  </details>
                ))}
              </div>
            </div>
          ))}

        {/* Empty state */}
        {eintraegeProKategorie.size === 0 && suchergebnisse && (
          <div className="drk-card text-center py-8">
            <p className="text-lg mb-2" style={{ color: 'var(--text-light)' }}>
              Keine passenden Fragen gefunden.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Versuchen Sie einen anderen Suchbegriff oder{' '}
              <button
                onClick={() => {
                  setSuchbegriff('');
                  setAktiveKategorie(null);
                }}
                className="underline"
                style={{ color: 'var(--drk)' }}
              >
                alle Fragen anzeigen
              </button>
              .
            </p>
          </div>
        )}

        {/* Contact */}
        <div className="drk-card border-l-4" style={{ borderLeftColor: 'var(--drk)' }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
            Fragen, Feedback oder Fehler gefunden?
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>
            Wenden Sie sich an den DRK Kreisverband StädteRegion Aachen e.V.:<br />
            <a
              href="mailto:digitalisierung@drk-aachen.de"
              style={{ color: 'var(--drk)' }}
              className="hover:underline"
            >
              digitalisierung@drk-aachen.de
            </a>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
