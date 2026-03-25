'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UsersIcon, DollarIcon, BookIcon, FileTextIcon, ActivityIcon, SettingsIcon } from './icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activePaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <HomeIcon /> },
  { href: '/spender', label: 'Spender', icon: <UsersIcon /> },
  { href: '/zuwendungen', label: 'Zuwendungen', icon: <DollarIcon /> },
  { href: '/spendenbuch', label: 'Spendenbuch', icon: <BookIcon /> },
  { href: '/bestaetigung', label: 'Bestätigung', icon: <FileTextIcon /> },
  { href: '/daten', label: 'Daten', icon: <ActivityIcon /> },
  {
    href: '/einstellungen',
    label: 'Einstellungen',
    activePaths: ['/einstellungen', '/einrichtung', '/export', '/api-schluessel'],
    icon: <SettingsIcon />,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b overflow-x-auto"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-1 px-6 whitespace-nowrap">
        {NAV_ITEMS.map((item) => {
          const isActive = item.activePaths
            ? item.activePaths.some((p) => pathname.startsWith(p))
            : item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 py-2.5 px-3 text-sm rounded-t transition-colors ${
                isActive ? 'font-semibold' : 'drk-hover-bg'
              }`}
              style={{
                color: isActive ? 'var(--drk)' : 'var(--text-light)',
                borderBottom: isActive ? '2px solid var(--drk)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
