export type Locale = 'de' | 'en';

// ── Gemeinsame Übersetzungen (in jeder DRK-App gleich) ──
const shared = {
  de: {
    'nav.impressum': 'Impressum',
    'nav.datenschutz': 'Datenschutz',
    'nav.hilfe': 'Hilfe',
    'nav.language': 'EN',
    'footer.copyright': '© {year} DRK Kreisverband StädteRegion Aachen e.V.',
    'footer.tagline': 'Open Source · Kostenlos · DSGVO-konform · Gebaut mit ❤️ für das Deutsche Rote Kreuz',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.close': 'Schließen',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'error.notfound': 'Seite nicht gefunden',
    'error.notfound.desc': 'Die angeforderte Seite existiert nicht.',
    'error.notfound.back': 'Zurück zur Startseite',
  },
  en: {
    'nav.impressum': 'Legal Notice',
    'nav.datenschutz': 'Privacy Policy',
    'nav.hilfe': 'Help',
    'nav.language': 'DE',
    'footer.copyright': '© {year} German Red Cross, District Association StädteRegion Aachen',
    'footer.tagline': 'Open Source · Free · GDPR-compliant · Built with ❤️ for the German Red Cross',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'error.notfound': 'Page not found',
    'error.notfound.desc': 'The requested page does not exist.',
    'error.notfound.back': 'Back to home',
  },
} as const;

// ── App-spezifische Übersetzungen (hier pro App erweitern) ──
const appTranslations = {
  de: {
    'app.title': 'DRK Spendenquittung',
    'app.subtitle': 'Zuwendungsbestätigungen für DRK-Verbände',
    'app.description': 'Erstellen Sie BMF-konforme Zuwendungsbestätigungen – direkt im Browser, ohne Server, DSGVO-konform.',
    'apiKeys.title': 'API-Schlüssel',
    'apiKeys.subtitle': 'Erlauben Sie externen Anwendungen den Zugriff auf Ihre Daten über die REST-API.',
    'apiKeys.create': 'Neuen Schlüssel erstellen',
    'apiKeys.delete': 'Löschen',
    'apiKeys.copyWarning': 'Dieser Schlüssel wird nur einmal angezeigt und kann nicht wiederhergestellt werden.',
    'apiKeys.noKeys': 'Noch keine API-Schlüssel erstellt.',
    'apiKeys.scope.spender.read': 'Spender lesen',
    'apiKeys.scope.spender.write': 'Spender bearbeiten',
    'apiKeys.scope.zuwendungen.read': 'Zuwendungen lesen',
    'apiKeys.scope.zuwendungen.write': 'Zuwendungen bearbeiten',
    'apiKeys.scope.kreisverband.read': 'Vereinsdaten lesen',
    'apiKeys.docs': 'API-Dokumentation ansehen',
  },
  en: {
    'app.title': 'DRK Donation Receipt',
    'app.subtitle': 'Tax Donation Receipts for DRK Associations',
    'app.description': 'Create BMF-compliant donation receipts – directly in your browser, no server, GDPR-compliant.',
    'apiKeys.title': 'API Keys',
    'apiKeys.subtitle': 'Allow external applications to access your data via the REST API.',
    'apiKeys.create': 'Create new key',
    'apiKeys.delete': 'Delete',
    'apiKeys.copyWarning': 'This key is shown only once and cannot be recovered.',
    'apiKeys.noKeys': 'No API keys created yet.',
    'apiKeys.scope.spender.read': 'Read donors',
    'apiKeys.scope.spender.write': 'Write donors',
    'apiKeys.scope.zuwendungen.read': 'Read donations',
    'apiKeys.scope.zuwendungen.write': 'Write donations',
    'apiKeys.scope.kreisverband.read': 'Read organization',
    'apiKeys.docs': 'View API documentation',
  },
} as const;

// ── Zusammengeführte Übersetzungen ──
type TranslationKey = keyof typeof shared['de'] | keyof typeof appTranslations['de'];

const translations: Record<Locale, Record<string, string>> = {
  de: { ...shared.de, ...appTranslations.de },
  en: { ...shared.en, ...appTranslations.en },
};

/**
 * Übersetzungsfunktion
 * @param key - Übersetzungsschlüssel
 * @param locale - Sprache (default: 'de')
 * @param params - Platzhalter-Werte, z.B. { year: '2026' }
 */
export function t(
  key: TranslationKey | string,
  locale: Locale = 'de',
  params?: Record<string, string>
): string {
  let text = translations[locale]?.[key] || translations['de']?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

/**
 * Alle Keys einer Kategorie holen (z.B. alle 'app.*' Keys)
 */
export function tGroup(prefix: string, locale: Locale = 'de'): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(translations[locale])) {
    if (key.startsWith(prefix)) {
      result[key] = value;
    }
  }
  return result;
}
