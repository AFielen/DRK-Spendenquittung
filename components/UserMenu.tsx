'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { ShieldIcon } from './icons';

export default function UserMenu() {
  const { nutzer, kreisverband, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!nutzer) return null;

  const initials = nutzer.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-colors"
        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
        title={nutzer.name}
        aria-label={`Benutzermenü: ${nutzer.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              {nutzer.name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
              {nutzer.email}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {nutzer.rolle === 'admin' ? 'Administrator' : nutzer.rolle === 'schatzmeister' ? 'Schatzmeister' : 'Leser'}
            </div>
            {kreisverband && (
              <div className="text-xs mt-2 pt-2 border-t" style={{ color: 'var(--text-light)', borderColor: 'var(--border)' }}>
                {kreisverband.name}
              </div>
            )}
          </div>
          <div className="p-2" role="menu">
            {nutzer.isSuperadmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg transition-colors drk-hover-bg"
                style={{ color: 'var(--text)' }}
                role="menuitem"
              >
                <ShieldIcon />
                Admin-Bereich
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors drk-hover-bg"
              style={{ color: 'var(--drk)' }}
              role="menuitem"
            >
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
