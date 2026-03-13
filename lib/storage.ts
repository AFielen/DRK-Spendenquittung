'use client';

import type { Verein, Spender, Zuwendung, AppSettings } from './types';

const KEYS = {
  verein: 'drk-sq-verein',
  spender: 'drk-sq-spender',
  spenden: 'drk-sq-spenden',
  settings: 'drk-sq-settings',
} as const;

// ── Generische Basis ──

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ── Verein ──

export function getVerein(): Verein | null {
  return getItem<Verein>(KEYS.verein);
}

export function setVerein(verein: Verein): void {
  setItem(KEYS.verein, verein);
}

export function removeVerein(): void {
  removeItem(KEYS.verein);
}

// ── Spender ──

export function getSpender(): Spender[] {
  return getItem<Spender[]>(KEYS.spender) ?? [];
}

export function getSpenderById(id: string): Spender | undefined {
  return getSpender().find((s) => s.id === id);
}

export function addSpender(spender: Spender): void {
  const list = getSpender();
  list.push(spender);
  setItem(KEYS.spender, list);
}

export function updateSpender(updated: Spender): void {
  const list = getSpender().map((s) => (s.id === updated.id ? updated : s));
  setItem(KEYS.spender, list);
}

export function deleteSpender(id: string): void {
  const list = getSpender().filter((s) => s.id !== id);
  setItem(KEYS.spender, list);
  // Zugehörige Zuwendungen ebenfalls löschen
  const zuwendungen = getZuwendungen().filter((z) => z.spenderId !== id);
  setItem(KEYS.spenden, zuwendungen);
}

// ── Zuwendungen ──

export function getZuwendungen(): Zuwendung[] {
  return getItem<Zuwendung[]>(KEYS.spenden) ?? [];
}

export function getZuwendungenBySpender(spenderId: string): Zuwendung[] {
  return getZuwendungen().filter((z) => z.spenderId === spenderId);
}

export function addZuwendung(zuwendung: Zuwendung): void {
  const list = getZuwendungen();
  list.push(zuwendung);
  setItem(KEYS.spenden, list);
}

export function updateZuwendung(updated: Zuwendung): void {
  const list = getZuwendungen().map((z) => (z.id === updated.id ? updated : z));
  setItem(KEYS.spenden, list);
}

export function deleteZuwendung(id: string): void {
  const list = getZuwendungen().filter((z) => z.id !== id);
  setItem(KEYS.spenden, list);
}

// ── Settings ──

const DEFAULT_SETTINGS: AppSettings = {
  laufendeNrFormat: 'SQ-{JAHR}-{NR}',
  laufendeNrAktuell: 1,
  laufendeNrJahr: new Date().getFullYear(),
  sammelbestaetigungJahr: new Date().getFullYear(),
  showKleinspenden: true,
};

export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.settings) ?? { ...DEFAULT_SETTINGS };
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const current = getSettings();
  setItem(KEYS.settings, { ...current, ...partial });
}

// ── Backup / Restore ──

export function exportAllData(): string {
  const data = {
    [KEYS.verein]: getVerein(),
    [KEYS.spender]: getSpender(),
    [KEYS.spenden]: getZuwendungen(),
    [KEYS.settings]: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): { spender: number; zuwendungen: number; neu: number } {
  const data = JSON.parse(json) as Record<string, unknown>;

  if (data[KEYS.verein]) {
    setItem(KEYS.verein, data[KEYS.verein]);
  }

  const importedSpender = (data[KEYS.spender] as Spender[] | undefined) ?? [];
  const existingSpender = getSpender();
  let neuCount = 0;

  for (const s of importedSpender) {
    const existing = existingSpender.find((e) => e.id === s.id);
    if (!existing) {
      existingSpender.push(s);
      neuCount++;
    } else if (s.aktualisiertAm > existing.aktualisiertAm) {
      Object.assign(existing, s);
    }
  }
  setItem(KEYS.spender, existingSpender);

  const importedZuwendungen = (data[KEYS.spenden] as Zuwendung[] | undefined) ?? [];
  const existingZuwendungen = getZuwendungen();

  for (const z of importedZuwendungen) {
    const existing = existingZuwendungen.find((e) => e.id === z.id);
    if (!existing) {
      existingZuwendungen.push(z);
    } else if (z.aktualisiertAm > existing.aktualisiertAm) {
      Object.assign(existing, z);
    }
  }
  setItem(KEYS.spenden, existingZuwendungen);

  if (data[KEYS.settings]) {
    setItem(KEYS.settings, data[KEYS.settings]);
  }

  return {
    spender: importedSpender.length,
    zuwendungen: importedZuwendungen.length,
    neu: neuCount,
  };
}

export function clearAllData(): void {
  removeItem(KEYS.verein);
  removeItem(KEYS.spender);
  removeItem(KEYS.spenden);
  removeItem(KEYS.settings);
}

export { KEYS };
