'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_TABS = [
  { href: '/admin', label: 'Übersicht', exact: true },
  { href: '/admin/nutzer', label: 'Nutzer', exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div
      className="border-b"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-1 px-6">
        <div
          className="flex items-center gap-1.5 py-2 px-3 text-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin
        </div>
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
        {ADMIN_TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-2.5 px-3 text-sm transition-colors ${
                isActive ? 'font-semibold' : 'hover:bg-gray-100'
              }`}
              style={{
                color: isActive ? 'var(--drk)' : 'var(--text-light)',
                borderBottom: isActive ? '2px solid var(--drk)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
