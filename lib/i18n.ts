'use client';

import { createContext, useContext, useState, useCallback, ReactNode, createElement } from 'react';

export type Locale = 'de' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  de: {
    // Navigation & Allgemein
    'nav.spenden': 'Unterstützen',
    'nav.hilfe': 'Hilfe',
    'nav.impressum': 'Impressum',
    'nav.datenschutz': 'Datenschutz',

    // Auth
    'auth.login': 'Anmelden',
    'auth.logout': 'Abmelden',
    'auth.email': 'E-Mail-Adresse',
    'auth.code': 'Bestätigungscode',
    'auth.nicht_angemeldet': 'Nicht angemeldet.',
    'auth.keine_berechtigung': 'Keine Berechtigung.',

    // Spender
    'spender.titel': 'Spendenbuch',
    'spender.neu': 'Neuer Spender',
    'spender.vorname': 'Vorname',
    'spender.nachname': 'Nachname',
    'spender.strasse': 'Straße',
    'spender.plz': 'PLZ',
    'spender.ort': 'Ort',

    // Zuwendungen
    'zuwendung.titel': 'Zuwendungen',
    'zuwendung.neu': 'Neue Zuwendung',
    'zuwendung.betrag': 'Betrag',
    'zuwendung.datum': 'Datum',
    'zuwendung.zweck': 'Verwendungszweck',

    // Bestätigung
    'bestaetigung.titel': 'Zuwendungsbestätigung',
    'bestaetigung.erstellen': 'Bestätigung erstellen',
    'bestaetigung.pdf': 'PDF herunterladen',
    'bestaetigung.docx': 'DOCX herunterladen',

    // Einstellungen
    'einstellung.titel': 'Einstellungen',
    'einstellung.kreisverband': 'Kreisverband-Daten',
    'einstellung.gefahrenzone': 'Gefahrenzone',

    // Footer
    'footer.drk': 'Deutsches Rotes Kreuz',
    'footer.kv': 'Kreisverband StädteRegion Aachen e.V.',
    'footer.made_with': 'made with',
    'footer.for': 'for',

    // Fehler
    'error.laden': 'Fehler beim Laden der Daten.',
    'error.speichern': 'Fehler beim Speichern.',
    'error.unbekannt': 'Ein unbekannter Fehler ist aufgetreten.',
  },
  en: {
    // EN translations are a follow-up — keys fall back to DE
  },
};

function getTranslation(locale: Locale, key: string): string {
  return translations[locale][key] ?? translations.de[key] ?? key;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'de',
  setLocale: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('de');
  const t = useCallback((key: string) => getTranslation(locale, key), [locale]);

  return createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t } },
    children,
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
