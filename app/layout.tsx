import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HelpIcon, HeartIcon, RedCrossIcon } from '@/components/icons';
import './globals.css';

export const metadata: Metadata = {
  title: 'DRK APP_TITEL',
  description: 'APP_BESCHREIBUNG – DRK Kreisverband StädteRegion Aachen e.V.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col">
        {/* ── Skip-to-Content (Barrierefreiheit) ── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded"
          style={{ background: 'var(--bg-card)', color: 'var(--drk)' }}
        >
          Zum Inhalt springen
        </a>

        {/* ── DRK Header ── */}
        <header
          className="flex items-center justify-between gap-3 px-6 py-4"
          style={{ background: '#e30613', color: '#fff' }}
        >
          <Link href="/" className="flex items-center gap-3" aria-label="Zur Startseite">
            <Image src="/logo.png" alt="DRK Logo" width={42} height={42} priority />
            <div>
              <h1 className="text-[1.4rem] font-bold leading-tight">APP_TITEL</h1>
              <div className="text-[0.8rem] opacity-85 hidden sm:block">APP_UNTERTITEL</div>
              <div className="text-[0.8rem] opacity-85 sm:hidden">APP_UNTERTITEL_KURZ</div>
            </div>
          </Link>

          {/* Rechte Seite: Spenden + Hilfe */}
          <div className="flex items-center gap-1">
            <Link
              href="/spenden"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
              title="Unterstützen"
              aria-label="Unterstützen"
            >
              <HeartIcon />
            </Link>
            <Link
              href="/hilfe"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
              title="Hilfe"
              aria-label="Hilfe"
            >
              <HelpIcon />
            </Link>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main id="main-content" className="flex-1">{children}</main>

        {/* ── DRK Footer ── */}
        <footer
          className="text-center py-10 mt-8 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="text-sm font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--drk)' }}
          >
            Deutsches Rotes Kreuz
          </div>
          <div className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
            Kreisverband StädteRegion Aachen e.V.
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-light)' }}>
            <Link href="/impressum" className="hover:underline" style={{ color: 'inherit' }}>
              Impressum
            </Link>
            {' · '}
            <Link href="/datenschutz" className="hover:underline" style={{ color: 'inherit' }}>
              Datenschutz
            </Link>
            {' · '}
            <Link href="/hilfe" className="hover:underline" style={{ color: 'inherit' }}>
              Hilfe
            </Link>
            {' · '}
            <Link href="/spenden" className="hover:underline" style={{ color: 'inherit' }}>
              Unterstützen
            </Link>
          </div>
          <div
            className="text-xs flex items-center justify-center gap-1"
            style={{ color: 'var(--text-light)' }}
          >
            made with{' '}
            <span style={{ color: 'var(--drk)' }}>❤</span>{' '}
            for{' '}
            <RedCrossIcon />
          </div>
        </footer>
      </body>
    </html>
  );
}
