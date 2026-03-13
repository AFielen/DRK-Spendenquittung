'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import Navigation from './Navigation';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import Link from 'next/link';
import { HeartIcon, HelpIcon } from './icons';
import Image from 'next/image';
import { ReactNode } from 'react';

const PUBLIC_PATHS = ['/login', '/impressum', '/datenschutz', '/hilfe', '/spenden'];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { nutzer, loading } = useAuth();

  const isPublicPage = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  const showNav = !loading && !!nutzer && !isPublicPage;

  return (
    <>
      {/* ── DRK Header ── */}
      <header
        className="flex items-center justify-between gap-3 px-6 py-4"
        style={{ background: '#e30613', color: '#fff' }}
      >
        <Link href="/" className="flex items-center gap-3" aria-label="Zur Startseite">
          <Image src="/logo.png" alt="DRK Logo" width={42} height={42} priority />
          <div>
            <h1 className="text-[1.4rem] font-bold leading-tight">DRK Spendenquittung</h1>
            <div className="text-[0.8rem] opacity-85 hidden sm:block">
              Zuwendungsbestätigungen für DRK-Verbände
            </div>
            <div className="text-[0.8rem] opacity-85 sm:hidden">Spendenquittungen</div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
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
          {nutzer && <UserMenu />}
        </div>
      </header>

      {/* ── Navigation (nur wenn eingeloggt und nicht auf Pflichtseiten) ── */}
      {showNav && <Navigation />}

      {/* ── Main Content ── */}
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
