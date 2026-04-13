# Hilfe-System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular help system with categorized FAQ + fuzzy search, contextual help drawer, guided tours, and extended HilfeHint — all driven by a central content store.

**Architecture:** A single content store (`lib/hilfe-content.ts`) feeds all four UI surfaces: the `/hilfe` FAQ page, a slide-in `HilfeDrawer`, a `GuidedTour` spotlight overlay, and the existing `HilfeHint` component (extended with `faqId` and `beispiel` props). No backend changes, no new dependencies.

**Tech Stack:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, CSS variables (DRK design system)

**Spec:** `docs/superpowers/specs/2026-04-13-hilfe-system-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `lib/hilfe-content.ts` | Types, categories, all FAQ entries (~40-50), tour definitions (4 tours) |
| `lib/fuzzy-search.ts` | Trigram-based fuzzy search with scoring (frage > tags > antwort) |

### New Components

| File | Responsibility |
|---|---|
| `components/HilfeDrawer.tsx` | Fixed "?" button + slide-in drawer with route-filtered FAQ + tour trigger |
| `components/GuidedTour.tsx` | Spotlight overlay + tooltip stepper, localStorage "seen" flags |

### Modified Files

| File | Change |
|---|---|
| `components/HilfeHint.tsx` | Add optional `faqId` and `beispiel` props (backward-compatible) |
| `app/hilfe/page.tsx` | Complete rewrite: search + category cards + grouped FAQ |
| `app/layout.tsx` | Add `HilfeDrawer` inside `AuthProvider` |
| `app/globals.css` | Add drawer + tour CSS animations |
| `app/spender/page.tsx` | Add `data-tour` attributes to key elements |
| `app/zuwendungen/page.tsx` | Add `data-tour` attributes to key elements |
| `app/bestaetigung/page.tsx` | Add `data-tour` attributes to key elements |
| `app/einrichtung/page.tsx` | Add `data-tour` attributes to key elements |

---

## Task 1: Fuzzy Search Utility (`lib/fuzzy-search.ts`)

**Files:**
- Create: `lib/fuzzy-search.ts`

Pure utility with no React dependencies — build first, used by Task 2 and Task 4.

- [ ] **Step 1: Create `lib/fuzzy-search.ts`**

```typescript
// lib/fuzzy-search.ts

/** Generate character trigrams from a string */
function trigrams(str: string): Set<string> {
  const s = str.toLowerCase().replace(/\s+/g, ' ').trim();
  const set = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

/** Calculate similarity between two strings (0..1) based on trigram overlap */
function similarity(a: string, b: string): number {
  const triA = trigrams(a);
  const triB = trigrams(b);
  if (triA.size === 0 || triB.size === 0) return 0;
  let overlap = 0;
  for (const t of triA) {
    if (triB.has(t)) overlap++;
  }
  return overlap / Math.max(triA.size, triB.size);
}

export interface FuzzyTarget {
  id: string;
  frage: string;
  antwort: string;
  tags: string[];
}

export interface FuzzyResult {
  id: string;
  score: number;
}

const THRESHOLD = 0.25;

/**
 * Search targets by query using trigram fuzzy matching.
 * Scoring weights: frage (3x) > tags (2x) > antwort (1x).
 * Returns matches sorted by score descending, filtered by threshold.
 */
export function fuzzySearch(query: string, targets: FuzzyTarget[]): FuzzyResult[] {
  if (query.trim().length < 2) return [];

  const results: FuzzyResult[] = [];

  for (const target of targets) {
    const frageScore = similarity(query, target.frage) * 3;
    const tagScore = Math.max(...target.tags.map((t) => similarity(query, t)), 0) * 2;
    // Strip HTML for antwort matching
    const plainAntwort = target.antwort.replace(/<[^>]*>/g, '');
    const antwortScore = similarity(query, plainAntwort);
    const score = Math.max(frageScore, tagScore, antwortScore);

    if (score >= THRESHOLD) {
      results.push({ id: target.id, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/fuzzy-search.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/fuzzy-search.ts
git commit -m "feat(hilfe): add trigram-based fuzzy search utility"
```

---

## Task 2: Content Store (`lib/hilfe-content.ts`)

**Files:**
- Create: `lib/hilfe-content.ts`

Central content store with types, categories, FAQ entries, and tour definitions. This is the largest file — all content lives here.

- [ ] **Step 1: Create types and categories**

```typescript
// lib/hilfe-content.ts

// ── Types ──

export type HilfeKategorie =
  | 'erste-schritte'
  | 'spenderverwaltung'
  | 'zuwendungen'
  | 'zuwendungsbestaetigungen'
  | 'freistellung-steuern'
  | 'export-archivierung'
  | 'api-integration'
  | 'sicherheit-datenschutz';

export interface HilfeEintrag {
  id: string;
  kategorie: HilfeKategorie;
  frage: string;
  antwort: string;
  tags: string[];
  seiten: string[];
}

export interface KategorieInfo {
  id: HilfeKategorie;
  titel: string;
  beschreibung: string;
  icon: string; // SVG path data for inline <svg>
}

export interface TourStep {
  target: string;
  titel: string;
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface Tour {
  id: string;
  seite: string;
  titel: string;
  steps: TourStep[];
}

// ── Categories ──

export const kategorien: KategorieInfo[] = [
  {
    id: 'erste-schritte',
    titel: 'Erste Schritte',
    beschreibung: 'Login, Einrichtung, Rollen',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    id: 'spenderverwaltung',
    titel: 'Spenderverwaltung',
    beschreibung: 'Anlegen, Bearbeiten, CSV-Import, Archivieren',
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  },
  {
    id: 'zuwendungen',
    titel: 'Zuwendungen',
    beschreibung: 'Geld- und Sachspenden erfassen, Zweckbindung',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  },
  {
    id: 'zuwendungsbestaetigungen',
    titel: 'Zuwendungsbestätigungen',
    beschreibung: 'Einzel, Sammel, Vereinfacht, PDF/DOCX, Unterschrift',
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  },
  {
    id: 'freistellung-steuern',
    titel: 'Freistellung & Steuern',
    beschreibung: 'Gültigkeit, Ablauf, Prüfung, gesetzliche Grundlagen',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'export-archivierung',
    titel: 'Export & Archivierung',
    beschreibung: 'Batch-Export, Doppel, Aufbewahrungsfristen',
    icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  },
  {
    id: 'api-integration',
    titel: 'API & Integration',
    beschreibung: 'API-Schlüssel, Scopes, Nutzung',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    id: 'sicherheit-datenschutz',
    titel: 'Sicherheit & Datenschutz',
    beschreibung: 'Daten, DSGVO, Löschung',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
];
```

- [ ] **Step 2: Add FAQ entries**

Add all FAQ entries after the categories array. There are ~45 entries across 8 categories. Below is the full content — append to the same file:

```typescript
// ── FAQ Entries ──

export const hilfeEintraege: HilfeEintrag[] = [
  // ── Erste Schritte ──
  {
    id: 'login-anmeldung',
    kategorie: 'erste-schritte',
    frage: 'Wie melde ich mich an?',
    antwort: 'Sie geben Ihre E-Mail-Adresse ein und erhalten einen 6-stelligen Anmeldecode per E-Mail. Es gibt kein Passwort — der Code ist 10 Minuten gültig. Ein Administrator muss Ihre E-Mail-Adresse vorab als Nutzer angelegt haben.',
    tags: ['login', 'anmelden', 'code', 'e-mail', 'passwort', 'zugang'],
    seiten: ['/login'],
  },
  {
    id: 'rollen-erklaerung',
    kategorie: 'erste-schritte',
    frage: 'Welche Rollen gibt es?',
    antwort: 'Es gibt drei Rollen: <strong>Admin</strong> — kann Nutzer verwalten und alle Einstellungen ändern. <strong>Schatzmeister</strong> — kann Spender, Zuwendungen und Bestätigungen verwalten. <strong>Leser</strong> — kann nur Daten ansehen, nichts ändern.',
    tags: ['rolle', 'admin', 'schatzmeister', 'leser', 'berechtigung', 'rechte'],
    seiten: ['/einrichtung', '/'],
  },
  {
    id: 'einrichtung-starten',
    kategorie: 'erste-schritte',
    frage: 'Wie richte ich die App ein?',
    antwort: 'Gehen Sie auf <strong>Einrichtung</strong> und durchlaufen Sie den 3-Schritte-Wizard: 1. Basisdaten (Name, Adresse, Finanzamt), 2. Steuer-Rechtliches (Freistellungsbescheid, Aktenzeichen), 3. Unterschrift (Name und Funktion des Zeichnungsberechtigten). Erst wenn alle Pflichtfelder ausgefüllt sind, können Bestätigungen erstellt werden.',
    tags: ['einrichtung', 'setup', 'wizard', 'konfiguration', 'starten', 'anfang'],
    seiten: ['/einrichtung', '/'],
  },
  {
    id: 'gleichzeitig-arbeiten',
    kategorie: 'erste-schritte',
    frage: 'Können mehrere Personen gleichzeitig arbeiten?',
    antwort: 'Ja. Da die Daten zentral gespeichert werden, können mehrere Nutzer gleichzeitig auf die Anwendung zugreifen. Jeder Nutzer hat ein eigenes Login mit einer zugewiesenen Rolle.',
    tags: ['mehrere nutzer', 'gleichzeitig', 'team', 'zusammenarbeit'],
    seiten: ['/'],
  },
  {
    id: 'dashboard-ueberblick',
    kategorie: 'erste-schritte',
    frage: 'Was zeigt mir das Dashboard?',
    antwort: 'Das Dashboard gibt einen Überblick über Ihre Spender, Zuwendungen und erstellte Bestätigungen. Über die Schnellzugriff-Buttons erreichen Sie die wichtigsten Funktionen direkt. Wenn die Einrichtung noch nicht abgeschlossen ist, werden Sie darauf hingewiesen.',
    tags: ['dashboard', 'startseite', 'übersicht', 'home'],
    seiten: ['/'],
  },

  // ── Spenderverwaltung ──
  {
    id: 'spender-anlegen',
    kategorie: 'spenderverwaltung',
    frage: 'Wie lege ich einen neuen Spender an?',
    antwort: 'Klicken Sie auf <strong>+ Neuer Spender</strong> in der Spenderverwaltung. Füllen Sie Name und Adresse aus. Pflichtfelder sind Nachname (oder Firmenname), Straße, PLZ und Ort. Sie können zwischen Person und Firma umschalten.',
    tags: ['spender', 'anlegen', 'erstellen', 'neu', 'person', 'firma'],
    seiten: ['/spender'],
  },
  {
    id: 'spender-bearbeiten',
    kategorie: 'spenderverwaltung',
    frage: 'Wie bearbeite ich einen Spender?',
    antwort: 'Klicken Sie auf den Bearbeiten-Button (Stift-Symbol) neben dem Spender in der Tabelle. Es öffnet sich das gleiche Formular wie beim Anlegen, mit den vorausgefüllten Daten.',
    tags: ['spender', 'bearbeiten', 'ändern', 'editieren', 'aktualisieren'],
    seiten: ['/spender'],
  },
  {
    id: 'csv-import',
    kategorie: 'spenderverwaltung',
    frage: 'Wie importiere ich Spender per CSV?',
    antwort: 'Klicken Sie auf <strong>CSV-Import</strong> in der Spenderverwaltung. Die CSV-Datei muss diese Spalten enthalten: <code>Vorname, Nachname, Strasse, PLZ, Ort</code>. Optionale Spalten: <code>Anrede, Titel, Land, SteuerIdNr</code>. Trennzeichen: Semikolon oder Komma. Bereits vorhandene Spender (gleicher Name + PLZ) werden automatisch erkannt und übersprungen. Maximal 5.000 Zeilen pro Import.',
    tags: ['csv', 'import', 'excel', 'datei', 'hochladen', 'massenimport'],
    seiten: ['/spender'],
  },
  {
    id: 'spender-archivieren',
    kategorie: 'spenderverwaltung',
    frage: 'Kann ich Spender archivieren statt löschen?',
    antwort: 'Ja. Archivierte Spender werden standardmäßig ausgeblendet, können aber über den Filter „Archivierte anzeigen" wieder sichtbar gemacht werden. So bleiben historische Daten erhalten, ohne die aktive Liste zu überfrachten.',
    tags: ['archiv', 'archivieren', 'ausblenden', 'löschen', 'entfernen'],
    seiten: ['/spender'],
  },
  {
    id: 'spender-suche',
    kategorie: 'spenderverwaltung',
    frage: 'Wie finde ich einen bestimmten Spender?',
    antwort: 'Nutzen Sie das Suchfeld über der Spendertabelle. Es durchsucht Vor- und Nachname, Firma und Ort. Die Tabelle filtert live beim Tippen.',
    tags: ['suche', 'finden', 'filtern', 'spender suchen'],
    seiten: ['/spender'],
  },

  // ── Zuwendungen ──
  {
    id: 'zuwendung-geld',
    kategorie: 'zuwendungen',
    frage: 'Wie erfasse ich eine Geldspende?',
    antwort: 'Gehen Sie auf <strong>Zuwendungen</strong> und klicken Sie <strong>+ Neue Zuwendung</strong>. Wählen Sie einen Spender, setzen Sie den Typ auf „Geld", geben Sie Betrag, Datum und Zugangsweg (z.B. Überweisung, Bar, Online) an. Wählen Sie den Zweck: Spende oder Mitgliedsbeitrag.',
    tags: ['geldspende', 'betrag', 'erfassen', 'eintragen', 'überweisung', 'bar'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'zuwendung-sach',
    kategorie: 'zuwendungen',
    frage: 'Wie erfasse ich eine Sachspende?',
    antwort: 'Wählen Sie den Typ „Sach" bei der Zuwendungserfassung. Pflichtfelder: Bezeichnung des Gegenstands, geschätzter Wert. Empfohlen: Alter, Zustand, historischer Kaufpreis, Art der Wertermittlung (Rechnung, eigene Ermittlung, Gutachten) und Herkunft (Privatvermögen, Betriebsvermögen). Je vollständiger die Angaben, desto rechtssicherer die Bestätigung.',
    tags: ['sachspende', 'gegenstand', 'wert', 'bewertung', 'sachzuwendung'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'zweckbindung',
    kategorie: 'zuwendungen',
    frage: 'Was bedeutet Zweckbindung?',
    antwort: 'Wenn ein Spender eine Zuwendung für einen bestimmten Zweck gibt (z.B. „nur für Katastrophenhilfe"), können Sie das als Zweckbindung erfassen. In der Zuwendungsbestätigung wird der Hinweis aufgenommen, dass es sich um eine zweckgebundene Zuwendung handelt.',
    tags: ['zweckbindung', 'zweck', 'gebunden', 'verwendungszweck'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'zuwendung-status',
    kategorie: 'zuwendungen',
    frage: 'Was bedeuten die Status-Symbole bei Zuwendungen?',
    antwort: 'Ein grüner Haken bedeutet: Zuwendungsbestätigung wurde erstellt. Kein Symbol: Noch keine Bestätigung erstellt. In der Detailansicht sehen Sie den genauen Typ (Anlage 3, 4, 14 oder Vereinfacht) und die laufende Nummer.',
    tags: ['status', 'bestätigt', 'offen', 'symbol', 'haken'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'aufwandsverzicht',
    kategorie: 'zuwendungen',
    frage: 'Was ist ein Aufwandsverzicht?',
    antwort: 'Ein Aufwandsverzicht liegt vor, wenn ein ehrenamtlich Tätiger auf die Erstattung seiner Aufwendungen verzichtet. Voraussetzungen: Der Anspruch auf Erstattung muss <strong>vor</strong> der Tätigkeit rechtswirksam eingeräumt worden sein (z.B. durch Satzung, Vorstandsbeschluss oder Vertrag) und der Verzicht muss zeitnah erfolgen.',
    tags: ['aufwandsverzicht', 'verzicht', 'ehrenamt', 'erstattung', 'aufwand'],
    seiten: ['/zuwendungen'],
  },

  // ── Zuwendungsbestätigungen ──
  {
    id: 'was-ist-zuwendungsbestaetigung',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist eine Zuwendungsbestätigung?',
    antwort: 'Eine Zuwendungsbestätigung (umgangssprachlich „Spendenquittung") ist ein steuerlich anerkannter Nachweis über eine Geld- oder Sachzuwendung an eine steuerbegünstigte Körperschaft. Sie berechtigt den Spender zum Spendenabzug gemäß § 10b EStG. Das BMF schreibt verbindliche Muster vor.',
    tags: ['zuwendungsbestätigung', 'spendenquittung', 'nachweis', 'steuer', 'abzug'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'bmf-muster',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Welche BMF-Muster werden verwendet?',
    antwort: 'Diese App verwendet die Anlagen 3, 4 und 14 des BMF-Schreibens vom 07.11.2013 (BStBl I S. 1333): <strong>Anlage 3</strong> für Geldspenden/Mitgliedsbeiträge, <strong>Anlage 4</strong> für Sachspenden und <strong>Anlage 14</strong> für Sammelbestätigungen. Die Texte werden exakt nach BMF-Vorgabe übernommen.',
    tags: ['bmf', 'muster', 'anlage', 'vorlage', 'formular'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'einzelbestaetigung',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Wie erstelle ich eine Einzelbestätigung?',
    antwort: 'Gehen Sie auf <strong>Bestätigung</strong> → Tab <strong>Einzelbestätigung</strong>. Wählen Sie einen Spender, dann die offene Zuwendung. Klicken Sie auf PDF oder DOCX herunterladen. Die Zuwendung wird automatisch als bestätigt markiert und erhält eine laufende Nummer.',
    tags: ['einzelbestätigung', 'anlage 3', 'anlage 4', 'einzeln', 'erstellen'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'sammelbestaetigung',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist eine Sammelbestätigung?',
    antwort: 'Eine Sammelbestätigung (Anlage 14) fasst alle Geldspenden eines Spenders in einem Zeitraum zusammen. Wählen Sie den Tab <strong>Sammelbestätigung</strong>, einen Spender und den Zeitraum (Von/Bis). Alle unbestätigten Geldspenden im Zeitraum werden aufgelistet und können gemeinsam bestätigt werden.',
    tags: ['sammelbestätigung', 'anlage 14', 'jahresbestätigung', 'sammeln', 'zeitraum'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'vereinfacht',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Wann reicht eine vereinfachte Bestätigung?',
    antwort: 'Für Spenden bis 300 € reicht ein vereinfachter Spendennachweis in Kombination mit dem Kontoauszug (§ 50 Abs. 4 EStDV). Die App bietet unter dem Tab <strong>Vereinfacht</strong> diese Option an. Es wird keine laufende Nummer vergeben.',
    tags: ['vereinfacht', '300 euro', 'vereinfachter nachweis', 'klein', 'kontoauszug'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'pdf-vs-docx',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist der Unterschied zwischen PDF und DOCX?',
    antwort: '<strong>PDF</strong> wird serverseitig generiert und enthält das vollständige Layout mit DRK-Briefpapier-Design. <strong>DOCX</strong> ist ein vorausgefülltes Word-Dokument — ideal zum Ausdrucken und händischen Unterschreiben. Beide Formate enthalten den exakt gleichen rechtlichen Text.',
    tags: ['pdf', 'docx', 'word', 'format', 'herunterladen', 'download'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'unterschrift',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Muss ich die Bestätigung unterschreiben?',
    antwort: 'Ja, eigenhändig. Diese App generiert ein vorausgefülltes Dokument. Es muss ausgedruckt und vom Unterschriftsberechtigten des Vereins händisch unterschrieben werden. Eine maschinelle Erstellung ohne Unterschrift erfordert eine Genehmigung des Finanzamts.',
    tags: ['unterschrift', 'unterschreiben', 'handschriftlich', 'signatur', 'druck'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'laufende-nummer',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist die laufende Nummer?',
    antwort: 'Jede Zuwendungsbestätigung erhält automatisch eine fortlaufende Nummer (z.B. 2026-001, 2026-002). Diese dient der Nachvollziehbarkeit und wird in den Bestätigungen und im Export aufgeführt. Vereinfachte Nachweise erhalten keine laufende Nummer.',
    tags: ['laufende nummer', 'nummerierung', 'reihenfolge', 'fortlaufend'],
    seiten: ['/bestaetigung'],
  },

  // ── Freistellung & Steuern ──
  {
    id: 'freistellung-gueltigkeit',
    kategorie: 'freistellung-steuern',
    frage: 'Wie lange ist mein Freistellungsbescheid gültig?',
    antwort: '5 Jahre ab Bescheiddatum (Freistellungsbescheid) bzw. 3 Jahre (Feststellungsbescheid nach § 60a AO). Nach Ablauf dürfen <strong>keine</strong> Zuwendungsbestätigungen mehr ausgestellt werden. Die App blockiert den Download automatisch.',
    tags: ['freistellung', 'gültigkeit', 'ablauf', 'bescheid', 'finanzamt', '5 jahre', '3 jahre'],
    seiten: ['/einrichtung', '/bestaetigung'],
  },
  {
    id: 'freistellung-warnung',
    kategorie: 'freistellung-steuern',
    frage: 'Was bedeuten die Farbcodes bei der Freistellung?',
    antwort: '<strong>Grün</strong>: Gültig. <strong>Gelb</strong>: Weniger als 6 Monate verbleibend — neuen Bescheid beantragen. <strong>Rot</strong>: Weniger als 3 Monate verbleibend — dringend handeln. <strong>Blockiert</strong>: Abgelaufen — keine Bestätigungen möglich, bis ein neuer Bescheid eingetragen ist.',
    tags: ['warnung', 'ampel', 'grün', 'gelb', 'rot', 'blockiert', 'freistellung'],
    seiten: ['/einrichtung', '/', '/bestaetigung'],
  },
  {
    id: 'steuerbeguenstigung',
    kategorie: 'freistellung-steuern',
    frage: 'Was bedeutet steuerbegünstigte Zwecke?',
    antwort: 'Als DRK-Kreisverband verfolgen Sie gemeinnützige, mildtätige und ggf. kirchliche Zwecke. Diese werden im Freistellungsbescheid aufgeführt und müssen in der Einrichtung der App korrekt eingetragen werden, da sie wortwörtlich auf den Bestätigungen erscheinen.',
    tags: ['steuerbegünstigt', 'gemeinnützig', 'mildtätig', 'zwecke', 'satzung'],
    seiten: ['/einrichtung'],
  },
  {
    id: 'sachspenden-steuer',
    kategorie: 'freistellung-steuern',
    frage: 'Was muss ich bei Sachspenden steuerlich beachten?',
    antwort: 'Bei Sachspenden muss der Gegenstand genau beschrieben werden (Bezeichnung, Alter, Zustand, historischer Kaufpreis). Der angesetzte Wert muss nachvollziehbar sein. Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten) müssen dem Doppel der Zuwendungsbestätigung in der Vereinsakte beigefügt werden (BMF Nr. 6). Bei Betriebsvermögen: Entnahmewert + Umsatzsteuer angeben.',
    tags: ['sachspende', 'steuer', 'bewertung', 'wertermittlung', 'betriebsvermögen'],
    seiten: ['/zuwendungen', '/bestaetigung'],
  },

  // ── Export & Archivierung ──
  {
    id: 'batch-export',
    kategorie: 'export-archivierung',
    frage: 'Wie erstelle ich einen Jahresexport?',
    antwort: 'Gehen Sie auf <strong>Export</strong>, wählen Sie das Steuerjahr und die gewünschten Optionen (Sammelbestätigungen, Einzelbestätigungen, Vereinfachte). Klicken Sie auf „Export starten". Die App erstellt eine ZIP-Datei mit allen Bestätigungen, Doppeln und einer CSV-Übersicht.',
    tags: ['export', 'zip', 'jahresexport', 'herunterladen', 'batch', 'massenexport'],
    seiten: ['/export'],
  },
  {
    id: 'doppel-aufbewahrung',
    kategorie: 'export-archivierung',
    frage: 'Wie lange muss ich die Doppel aufbewahren?',
    antwort: '10 Jahre gemäß § 50 Abs. 7 EStDV. Der Batch-Export erstellt automatisch Doppel-Kopien aller Bestätigungen. Bewahren Sie die ZIP-Datei sicher auf (z.B. Vereins-NAS, USB-Stick, externer Datenträger).',
    tags: ['doppel', 'aufbewahrung', 'kopie', '10 jahre', 'frist', 'archiv'],
    seiten: ['/export'],
  },
  {
    id: 'doppel-pflicht',
    kategorie: 'export-archivierung',
    frage: 'Was ist ein Doppel?',
    antwort: 'Ein Doppel ist eine identische Kopie der Zuwendungsbestätigung, die der Verein für seine eigenen Unterlagen aufbewahren muss. Das Doppel wird beim Export automatisch erstellt — es ist keine optionale Funktion, sondern gesetzliche Pflicht.',
    tags: ['doppel', 'kopie', 'pflicht', 'vereinsakte'],
    seiten: ['/export', '/bestaetigung'],
  },
  {
    id: 'datenspeicherung',
    kategorie: 'export-archivierung',
    frage: 'Wo sind meine Daten gespeichert?',
    antwort: 'Alle Daten werden sicher in einer PostgreSQL-Datenbank auf dem Server gespeichert. Im Gegensatz zu einer Browser-Lösung gehen Ihre Daten nicht verloren, wenn Sie den Browser wechseln oder den Cache leeren. Zugriff erfolgt über Ihr persönliches Login.',
    tags: ['datenbank', 'server', 'speicherung', 'postgresql', 'sicherung'],
    seiten: ['/'],
  },

  // ── API & Integration ──
  {
    id: 'api-schluessel-erstellen',
    kategorie: 'api-integration',
    frage: 'Wie erstelle ich einen API-Schlüssel?',
    antwort: 'Gehen Sie auf <strong>API-Schlüssel</strong> in den Einstellungen. Klicken Sie „Neuen Schlüssel erstellen", wählen Sie die gewünschten Berechtigungen (Scopes) und vergeben Sie einen Namen. Der Schlüssel wird nur einmal angezeigt — kopieren Sie ihn sofort.',
    tags: ['api', 'schlüssel', 'key', 'token', 'erstellen', 'zugang'],
    seiten: ['/api-schluessel'],
  },
  {
    id: 'api-scopes',
    kategorie: 'api-integration',
    frage: 'Was sind API-Scopes?',
    antwort: 'Scopes definieren, was ein API-Schlüssel darf: <code>spender:read</code> — Spenderdaten lesen. <code>spender:write</code> — Spender anlegen/ändern. <code>zuwendungen:read</code> — Zuwendungen lesen. <code>zuwendungen:write</code> — Zuwendungen anlegen/ändern. <code>kreisverband:read</code> — Vereinsdaten lesen. Geben Sie nur die Berechtigungen, die tatsächlich benötigt werden.',
    tags: ['scope', 'berechtigung', 'api', 'zugriff', 'lesen', 'schreiben'],
    seiten: ['/api-schluessel'],
  },
  {
    id: 'api-rate-limit',
    kategorie: 'api-integration',
    frage: 'Gibt es ein Rate-Limit für die API?',
    antwort: 'Ja, maximal 100 Anfragen pro Minute pro API-Schlüssel. Bei Überschreitung erhalten Sie einen HTTP 429-Fehler. Warten Sie eine Minute und versuchen Sie es erneut.',
    tags: ['rate limit', 'limit', 'drosselung', '429', 'anfragen'],
    seiten: ['/api-schluessel', '/api-dokumentation'],
  },
  {
    id: 'api-authentifizierung',
    kategorie: 'api-integration',
    frage: 'Wie authentifiziere ich API-Anfragen?',
    antwort: 'Senden Sie den API-Schlüssel als Bearer-Token im Authorization-Header: <code>Authorization: Bearer sk_live_...</code>. Alle API-Endpunkte sind unter <code>/api/v1/</code> erreichbar. Details finden Sie in der API-Dokumentation.',
    tags: ['bearer', 'token', 'header', 'authorization', 'authentifizierung'],
    seiten: ['/api-schluessel', '/api-dokumentation'],
  },

  // ── Sicherheit & Datenschutz ──
  {
    id: 'dsgvo-konformitaet',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Ist die App DSGVO-konform?',
    antwort: 'Ja. Es werden keine Cookies gesetzt, keine externen Tracking-Dienste verwendet und keine Daten an Dritte übermittelt. Alle Daten werden auf einem Server in Deutschland gespeichert. Es gibt keine Verbindung zu US-Diensten (Google, Meta, etc.).',
    tags: ['dsgvo', 'datenschutz', 'konform', 'cookies', 'tracking'],
    seiten: ['/datenschutz'],
  },
  {
    id: 'daten-loeschen',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Wie lösche ich Spenderdaten?',
    antwort: 'Spender können über den Löschen-Button in der Spenderverwaltung entfernt werden. Achtung: Damit werden auch alle zugehörigen Zuwendungen und Bestätigungen gelöscht. Alternativ können Sie Spender archivieren, um sie auszublenden ohne Daten zu verlieren.',
    tags: ['löschen', 'entfernen', 'daten', 'spender', 'dsgvo', 'recht auf löschung'],
    seiten: ['/spender'],
  },
  {
    id: 'session-sicherheit',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Wie sicher ist die Anmeldung?',
    antwort: 'Die App nutzt Magic-Link-Authentifizierung (6-stellige Codes per E-Mail). Codes sind 10 Minuten gültig und können nur einmal verwendet werden. Sessions werden serverseitig verwaltet (HttpOnly Cookies). Es gibt Schutz gegen Brute-Force-Angriffe durch Rate-Limiting.',
    tags: ['sicherheit', 'session', 'cookie', 'brute force', 'anmeldung'],
    seiten: ['/login'],
  },
  {
    id: 'hosting-standort',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Wo wird die App gehostet?',
    antwort: 'Die App wird auf einem Server in Deutschland gehostet (Hetzner). Es werden keine Cloud-Dienste von US-Anbietern verwendet. Der Quellcode ist Open Source und kann jederzeit auf GitHub eingesehen werden.',
    tags: ['hosting', 'server', 'standort', 'deutschland', 'hetzner', 'open source'],
    seiten: ['/datenschutz', '/impressum'],
  },
  {
    id: 'open-source',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Ist die App Open Source?',
    antwort: 'Ja, der Quellcode ist auf GitHub frei verfügbar. Die App steht unter der MIT-Lizenz. Jeder kann den Code einsehen, prüfen und eigene Änderungen vorschlagen.',
    tags: ['open source', 'github', 'quellcode', 'lizenz', 'mit'],
    seiten: [],
  },
];
```

- [ ] **Step 3: Add tour definitions**

Append tour definitions to the same file:

```typescript
// ── Tours ──

export const tours: Tour[] = [
  {
    id: 'einrichtung',
    seite: '/einrichtung',
    titel: 'Einrichtung Schritt für Schritt',
    steps: [
      {
        target: '[data-tour="setup-wizard"]',
        titel: 'Der Einrichtungs-Wizard',
        text: 'Hier richten Sie Ihren Kreisverband ein. Der Wizard führt Sie durch drei Schritte: Basisdaten, Steuer-Rechtliches und Unterschrift.',
        position: 'bottom',
      },
      {
        target: '[data-tour="setup-basisdaten"]',
        titel: 'Schritt 1: Basisdaten',
        text: 'Name des Verbands, Adresse, zuständiges Finanzamt und Kontaktdaten. Diese Informationen erscheinen auf allen Zuwendungsbestätigungen.',
        position: 'bottom',
      },
      {
        target: '[data-tour="setup-steuer"]',
        titel: 'Schritt 2: Steuer-Rechtliches',
        text: 'Freistellungsbescheid-Datum, Aktenzeichen und steuerbegünstigte Zwecke. Ohne gültigen Freistellungsbescheid können keine Bestätigungen erstellt werden.',
        position: 'bottom',
      },
      {
        target: '[data-tour="setup-unterschrift"]',
        titel: 'Schritt 3: Unterschrift',
        text: 'Name und Funktion des Zeichnungsberechtigten. Diese Person muss jede Bestätigung eigenhändig unterschreiben.',
        position: 'bottom',
      },
      {
        target: '[data-tour="tab-nutzer"]',
        titel: 'Nutzerverwaltung',
        text: 'Hier können Admins weitere Nutzer hinzufügen und Rollen zuweisen (Admin, Schatzmeister, Leser).',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'spender',
    seite: '/spender',
    titel: 'Spenderverwaltung kennenlernen',
    steps: [
      {
        target: '[data-tour="spender-titel"]',
        titel: 'Spenderverwaltung',
        text: 'Hier verwalten Sie alle Spender Ihres Kreisverbands — Personen und Firmen.',
        position: 'bottom',
      },
      {
        target: '[data-tour="btn-neuer-spender"]',
        titel: 'Neuen Spender anlegen',
        text: 'Klicken Sie hier, um einen Spender manuell anzulegen. Pflichtfelder: Name, Straße, PLZ und Ort.',
        position: 'bottom',
      },
      {
        target: '[data-tour="btn-csv-import"]',
        titel: 'CSV-Import',
        text: 'Importieren Sie viele Spender auf einmal per CSV-Datei. Duplikate werden automatisch erkannt.',
        position: 'bottom',
      },
      {
        target: '[data-tour="spender-tabelle"]',
        titel: 'Spenderliste',
        text: 'Alle Spender auf einen Blick. Sie können suchen, sortieren und zwischen aktiven und archivierten Spendern wechseln.',
        position: 'top',
      },
    ],
  },
  {
    id: 'zuwendungen',
    seite: '/zuwendungen',
    titel: 'Zuwendungen erfassen',
    steps: [
      {
        target: '[data-tour="zuwendung-titel"]',
        titel: 'Zuwendungen',
        text: 'Hier erfassen und verwalten Sie alle eingegangenen Spenden und Mitgliedsbeiträge.',
        position: 'bottom',
      },
      {
        target: '[data-tour="btn-neue-zuwendung"]',
        titel: 'Neue Zuwendung',
        text: 'Erfassen Sie eine neue Geld- oder Sachspende. Wählen Sie den Spender und geben Sie die Details ein.',
        position: 'bottom',
      },
      {
        target: '[data-tour="zuwendung-tabelle"]',
        titel: 'Zuwendungsliste',
        text: 'Alle Zuwendungen mit Status: Offene Zuwendungen warten auf eine Bestätigung, bestätigte haben einen grünen Haken.',
        position: 'top',
      },
    ],
  },
  {
    id: 'bestaetigung',
    seite: '/bestaetigung',
    titel: 'Bestätigungen erstellen',
    steps: [
      {
        target: '[data-tour="tab-einzel"]',
        titel: 'Einzelbestätigung',
        text: 'Für einzelne Geld- oder Sachspenden. Wählen Sie einen Spender und die offene Zuwendung, dann laden Sie die Bestätigung herunter.',
        position: 'bottom',
      },
      {
        target: '[data-tour="tab-sammel"]',
        titel: 'Sammelbestätigung',
        text: 'Fasst alle Geldspenden eines Spenders in einem Zeitraum zusammen (Anlage 14). Ideal für den Jahresabschluss.',
        position: 'bottom',
      },
      {
        target: '[data-tour="tab-vereinfacht"]',
        titel: 'Vereinfachte Bestätigung',
        text: 'Für Spenden bis 300 € reicht ein vereinfachter Nachweis. Keine laufende Nummer nötig.',
        position: 'bottom',
      },
      {
        target: '[data-tour="bestaetigung-spender"]',
        titel: 'Spender auswählen',
        text: 'Wählen Sie den Spender, für den Sie eine Bestätigung erstellen möchten. Es werden nur Spender mit offenen Zuwendungen angezeigt.',
        position: 'bottom',
      },
      {
        target: '[data-tour="bestaetigung-download"]',
        titel: 'Herunterladen',
        text: 'Laden Sie die Bestätigung als PDF (mit DRK-Layout) oder DOCX (zum Ausfüllen) herunter. Vergessen Sie nicht: Ausdrucken und eigenhändig unterschreiben!',
        position: 'top',
      },
    ],
  },
];

// ── Helpers ──

/** Get all FAQ entries for a specific route */
export function getEintraegeForSeite(seite: string): HilfeEintrag[] {
  return hilfeEintraege.filter((e) => e.seiten.includes(seite));
}

/** Get all FAQ entries for a specific category */
export function getEintraegeForKategorie(kategorie: HilfeKategorie): HilfeEintrag[] {
  return hilfeEintraege.filter((e) => e.kategorie === kategorie);
}

/** Get a single FAQ entry by ID */
export function getEintragById(id: string): HilfeEintrag | undefined {
  return hilfeEintraege.find((e) => e.id === id);
}

/** Get tour for a specific route */
export function getTourForSeite(seite: string): Tour | undefined {
  return tours.find((t) => t.seite === seite);
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/hilfe-content.ts`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add lib/hilfe-content.ts
git commit -m "feat(hilfe): add central content store with 45 FAQ entries, 8 categories, 4 tours"
```

---

## Task 3: CSS Animations for Drawer and Tour (`app/globals.css`)

**Files:**
- Modify: `app/globals.css`

Add animations for drawer slide-in and tour overlay.

- [ ] **Step 1: Add drawer and tour CSS to `app/globals.css`**

Append before the `/* ── Print Styles ── */` section (before line 286):

```css
/* ── Hilfe-Drawer ── */
@keyframes drawerSlideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.drk-drawer-enter {
  animation: drawerSlideIn 200ms ease-out;
}

/* ── Guided Tour ── */
.drk-tour-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  pointer-events: none;
}

.drk-tour-spotlight {
  position: relative;
  z-index: 9999;
  pointer-events: auto;
}

.drk-tour-tooltip {
  position: absolute;
  z-index: 10000;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1.25rem;
  max-width: 320px;
  width: max-content;
  animation: fadeIn 200ms ease-out;
}
```

- [ ] **Step 2: Add drawer/tour to reduced-motion section**

Find the existing `@media (prefers-reduced-motion: reduce)` block (line 227) and add the new classes:

```css
@media (prefers-reduced-motion: reduce) {
  .drk-fade-in,
  .drk-slide-up,
  .drk-sheet-enter,
  .drk-backdrop-enter,
  .drk-drawer-enter,
  .drk-tour-tooltip {
    animation: none;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style(hilfe): add drawer and tour CSS animations"
```

---

## Task 4: FAQ Page Rewrite (`app/hilfe/page.tsx`)

**Files:**
- Modify: `app/hilfe/page.tsx` (complete rewrite)

- [ ] **Step 1: Rewrite `app/hilfe/page.tsx`**

Replace the entire file content:

```tsx
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

  // Sync URL params on mount
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
        {/* ── Header ── */}
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Hilfe & Anleitung
          </h2>
          <p style={{ color: 'var(--text-light)' }}>
            Antworten auf häufige Fragen rund um Zuwendungsbestätigungen und die App.
          </p>
        </div>

        {/* ── Search ── */}
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

        {/* ── Category Cards ── */}
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

        {/* ── FAQ Sections ── */}
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

        {/* ── Empty state ── */}
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

        {/* ── Contact ── */}
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
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds (or only pre-existing warnings)

- [ ] **Step 3: Commit**

```bash
git add app/hilfe/page.tsx
git commit -m "feat(hilfe): rewrite FAQ page with categories, fuzzy search, and URL params"
```

---

## Task 5: Hilfe-Drawer Component (`components/HilfeDrawer.tsx`)

**Files:**
- Create: `components/HilfeDrawer.tsx`
- Modify: `app/layout.tsx` (add drawer)

- [ ] **Step 1: Create `components/HilfeDrawer.tsx`**

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { getEintraegeForSeite, getTourForSeite } from '@/lib/hilfe-content';

const PUBLIC_PATHS = ['/login', '/impressum', '/datenschutz', '/hilfe', '/spenden', '/registrierung'];

// Page display names for the drawer title
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

  // Hide on public pages
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return null;

  const eintraege = getEintraegeForSeite(pathname);
  const tour = getTourForSeite(pathname);
  const seitenName = SEITEN_NAMEN[pathname] ?? 'diese Seite';

  return (
    <>
      {/* ── Floating Button ── */}
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

      {/* ── Drawer ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 drk-backdrop-enter"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-label="Hilfe-Panel"
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] overflow-y-auto drk-drawer-enter"
            style={{ background: 'var(--bg-card)' }}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  Hilfe
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {seitenName}
                </p>
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
              {/* Tour Button */}
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

              {/* Context FAQ */}
              {eintraege.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    Häufige Fragen
                  </h3>
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

              {/* Link to full help */}
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
```

- [ ] **Step 2: Add `HilfeDrawer` to `app/layout.tsx`**

In `app/layout.tsx`, add the import and component inside the `AuthProvider`:

Add import at line 5:
```typescript
import HilfeDrawer from '@/components/HilfeDrawer';
```

Add `<HilfeDrawer />` after `<AppShell>{children}</AppShell>` (after line 35), still inside `<AuthProvider>`:

```tsx
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <HilfeDrawer />
        </AuthProvider>
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/HilfeDrawer.tsx app/layout.tsx
git commit -m "feat(hilfe): add contextual help drawer with floating button"
```

---

## Task 6: Guided Tour Component (`components/GuidedTour.tsx`)

**Files:**
- Create: `components/GuidedTour.tsx`

- [ ] **Step 1: Create `components/GuidedTour.tsx`**

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getTourForSeite, type TourStep } from '@/lib/hilfe-content';

function getStorageKey(tourId: string) {
  return `tour-${tourId}-gesehen`;
}

interface TooltipPosition {
  top: number;
  left: number;
}

function calculateTooltipPosition(
  rect: DOMRect,
  position: TourStep['position'],
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPosition {
  const gap = 12;
  const viewportWidth = window.innerWidth;

  // On mobile, always position at bottom of element
  if (viewportWidth < 640) {
    return {
      top: rect.bottom + gap + window.scrollY,
      left: Math.max(8, Math.min(rect.left + window.scrollX, viewportWidth - tooltipWidth - 8)),
    };
  }

  let top: number;
  let left: number;

  switch (position) {
    case 'top':
      top = rect.top - tooltipHeight - gap + window.scrollY;
      left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
      break;
    case 'bottom':
      top = rect.bottom + gap + window.scrollY;
      left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
      left = rect.left - tooltipWidth - gap + window.scrollX;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
      left = rect.right + gap + window.scrollX;
      break;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));
  top = Math.max(8 + window.scrollY, top);

  return { top, left };
}

export default function GuidedTour() {
  const pathname = usePathname();
  const tour = getTourForSeite(pathname);
  const [aktiv, setAktiv] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const promptShownRef = useRef(false);

  // Check if tour should auto-prompt on first visit
  useEffect(() => {
    if (!tour || promptShownRef.current) return;
    const seen = localStorage.getItem(getStorageKey(tour.id));
    if (!seen) {
      // Delay to let the page render first
      const timer = setTimeout(() => setShowPrompt(true), 800);
      promptShownRef.current = true;
      return () => clearTimeout(timer);
    }
  }, [tour]);

  // Reset when pathname changes
  useEffect(() => {
    setAktiv(false);
    setShowPrompt(false);
    setStep(0);
    promptShownRef.current = false;
  }, [pathname]);

  // Position tooltip and scroll to target when step changes
  useEffect(() => {
    if (!aktiv || !tour) return;

    const currentStep = tour.steps[step];
    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el) return;

    // Add spotlight class
    el.classList.add('drk-tour-spotlight');

    // Scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Position tooltip after scroll settles
    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      const tooltipWidth = tooltipEl?.offsetWidth ?? 320;
      const tooltipHeight = tooltipEl?.offsetHeight ?? 150;
      setTooltipPos(calculateTooltipPosition(rect, currentStep.position, tooltipWidth, tooltipHeight));
    }, 350);

    return () => {
      clearTimeout(timer);
      el.classList.remove('drk-tour-spotlight');
    };
  }, [aktiv, step, tour]);

  // Keyboard navigation
  useEffect(() => {
    if (!aktiv) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        endTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const startTour = useCallback(() => {
    setShowPrompt(false);
    setStep(0);
    setAktiv(true);
  }, []);

  const endTour = useCallback(() => {
    setAktiv(false);
    if (tour) {
      localStorage.setItem(getStorageKey(tour.id), 'true');
    }
  }, [tour]);

  const nextStep = useCallback(() => {
    if (!tour) return;
    if (step < tour.steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      endTour();
    }
  }, [step, tour, endTour]);

  const prevStep = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!tour) return null;

  // Auto-prompt dialog
  if (showPrompt && !aktiv) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 drk-backdrop-enter">
        <div
          className="drk-card max-w-sm mx-4 drk-fade-in text-center"
          role="dialog"
          aria-label="Tour-Einladung"
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
            {tour.titel}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
            Möchten Sie eine kurze Einführung zu dieser Seite?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setShowPrompt(false);
                localStorage.setItem(getStorageKey(tour.id), 'true');
              }}
              className="drk-btn-secondary text-sm"
            >
              Nein, danke
            </button>
            <button onClick={startTour} className="drk-btn-primary text-sm">
              Tour starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!aktiv) return null;

  const currentStep = tour.steps[step];

  return (
    <>
      {/* Overlay */}
      <div className="drk-tour-overlay" onClick={endTour} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="drk-tour-tooltip"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        role="dialog"
        aria-label={currentStep.titel}
      >
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          {step + 1} von {tour.steps.length}
        </div>
        <h4 className="font-bold mb-1" style={{ color: 'var(--text)' }}>
          {currentStep.titel}
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
          {currentStep.text}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={endTour}
            className="text-xs underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Überspringen
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={prevStep} className="drk-btn-secondary text-xs px-3 py-1.5" style={{ minHeight: 'auto' }}>
                Zurück
              </button>
            )}
            <button onClick={nextStep} className="drk-btn-primary text-xs px-3 py-1.5" style={{ minHeight: 'auto' }}>
              {step < tour.steps.length - 1 ? 'Weiter' : 'Fertig'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Hook for starting the tour from outside (e.g. HilfeDrawer) */
export function useTourStarter(): [boolean, () => void] {
  const [trigger, setTrigger] = useState(false);
  const start = useCallback(() => setTrigger(true), []);

  useEffect(() => {
    if (trigger) setTrigger(false);
  }, [trigger]);

  return [trigger, start];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit components/GuidedTour.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/GuidedTour.tsx
git commit -m "feat(hilfe): add guided tour component with spotlight overlay"
```

---

## Task 7: Integrate GuidedTour into Layout and Wire to Drawer

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/HilfeDrawer.tsx`

The GuidedTour needs to be in the layout, and the Drawer's "Tour starten" button needs to trigger it.

- [ ] **Step 1: Create a wrapper component to wire Drawer and Tour**

Since both components need to communicate (Drawer triggers Tour), create a minimal wrapper. Modify `app/layout.tsx`:

Replace the existing `AuthProvider` block:

```tsx
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <HilfeDrawer />
        </AuthProvider>
```

With:

```tsx
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <HilfeSystem />
        </AuthProvider>
```

Add the import and inline the wrapper at the top of the file:

```typescript
import HilfeSystem from '@/components/HilfeSystem';
```

- [ ] **Step 2: Create `components/HilfeSystem.tsx`**

```tsx
'use client';

import { useState, useCallback } from 'react';
import HilfeDrawer from './HilfeDrawer';
import GuidedTour from './GuidedTour';

export default function HilfeSystem() {
  const [tourRequested, setTourRequested] = useState(false);

  const handleStartTour = useCallback(() => {
    setTourRequested(true);
  }, []);

  const handleTourStarted = useCallback(() => {
    setTourRequested(false);
  }, []);

  return (
    <>
      <HilfeDrawer onStartTour={handleStartTour} />
      <GuidedTour externalTrigger={tourRequested} onTriggerConsumed={handleTourStarted} />
    </>
  );
}
```

- [ ] **Step 3: Update `GuidedTour.tsx` to accept external trigger**

Add `externalTrigger` and `onTriggerConsumed` props to the component. Update the interface and add an effect:

Add these props to the component signature:

```typescript
interface GuidedTourProps {
  externalTrigger?: boolean;
  onTriggerConsumed?: () => void;
}

export default function GuidedTour({ externalTrigger, onTriggerConsumed }: GuidedTourProps) {
```

Add this effect after the existing effects (before `startTour` definition):

```typescript
  // Handle external trigger from HilfeDrawer
  useEffect(() => {
    if (externalTrigger && tour) {
      startTour();
      onTriggerConsumed?.();
    }
  }, [externalTrigger, tour, onTriggerConsumed, startTour]);
```

Remove the exported `useTourStarter` hook — it's no longer needed since we're using `HilfeSystem` for wiring.

- [ ] **Step 4: Update `app/layout.tsx` import**

Replace `import HilfeDrawer from '@/components/HilfeDrawer';` with `import HilfeSystem from '@/components/HilfeSystem';`.

- [ ] **Step 5: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add components/HilfeSystem.tsx components/GuidedTour.tsx app/layout.tsx
git commit -m "feat(hilfe): wire guided tour trigger to help drawer via HilfeSystem wrapper"
```

---

## Task 8: Extend HilfeHint Component

**Files:**
- Modify: `components/HilfeHint.tsx`

- [ ] **Step 1: Extend `HilfeHint.tsx` with `faqId` and `beispiel` props**

Replace the entire file:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getEintragById } from '@/lib/hilfe-content';

interface HilfeHintProps {
  text: string;
  faqId?: string;
  beispiel?: string;
}

export default function HilfeHint({ text, faqId, beispiel }: HilfeHintProps) {
  const [open, setOpen] = useState(false);

  const faqEintrag = faqId ? getEintragById(faqId) : undefined;

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-colors"
        style={{
          background: open ? 'var(--drk)' : 'var(--border)',
          color: open ? '#fff' : 'var(--text-light)',
        }}
        aria-label="Hilfe anzeigen"
      >
        ?
      </button>
      {open && (
        <>
          {/* Mobile: Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 sm:hidden z-40"
            onClick={() => setOpen(false)}
          />
          {/* Mobile: Bottom-Sheet / Desktop: Tooltip */}
          <div
            className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:left-0 sm:right-auto sm:top-7 z-50 sm:w-72 p-4 sm:p-3 rounded-t-xl sm:rounded-lg text-sm shadow-lg drk-sheet-enter sm:drk-fade-in"
            style={{
              background: 'var(--info-bg)',
              border: '1px solid #93c5fd',
              color: 'var(--text)',
            }}
          >
            <div className="font-semibold mb-1 sm:hidden" style={{ color: 'var(--text)' }}>
              Hilfe
            </div>
            {text}

            {/* Example box */}
            {beispiel && (
              <div
                className="mt-2 px-2 py-1 rounded text-xs"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
              >
                {beispiel}
              </div>
            )}

            {/* FAQ link */}
            {faqEintrag && (
              <Link
                href={`/hilfe?q=${encodeURIComponent(faqEintrag.frage)}`}
                className="block mt-2 text-xs font-semibold hover:underline"
                style={{ color: 'var(--drk)' }}
                onClick={() => setOpen(false)}
              >
                Mehr dazu in der Hilfe →
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="block mt-2 text-xs underline"
              style={{ color: 'var(--text-light)' }}
            >
              Schließen
            </button>
          </div>
        </>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit components/HilfeHint.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/HilfeHint.tsx
git commit -m "feat(hilfe): extend HilfeHint with faqId and beispiel props"
```

---

## Task 9: Add `data-tour` Attributes to Spender Page

**Files:**
- Modify: `app/spender/page.tsx`

- [ ] **Step 1: Add `data-tour` attributes to key elements**

In `app/spender/page.tsx`, add attributes to the elements the tour targets:

1. The `<h2>` title (line 54): add `data-tour="spender-titel"`
```tsx
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }} data-tour="spender-titel">
```

2. The CSV-Import button (line 58): add `data-tour="btn-csv-import"`
```tsx
              <button className="drk-btn-secondary text-sm" onClick={() => setShowCsv(true)} data-tour="btn-csv-import">
```

3. The "+ Neuer Spender" button (line 61): add `data-tour="btn-neuer-spender"`
```tsx
              <button
                className="drk-btn-primary text-sm"
                data-tour="btn-neuer-spender"
```

4. The `<SpenderTabelle>` component (line 73): wrap or add attribute
```tsx
          <div data-tour="spender-tabelle">
            <SpenderTabelle
```
Close the wrapping div after `/>` on line 79:
```tsx
            />
          </div>
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx tsc --noEmit app/spender/page.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/spender/page.tsx
git commit -m "feat(hilfe): add data-tour attributes to spender page"
```

---

## Task 10: Add `data-tour` Attributes to Zuwendungen Page

**Files:**
- Modify: `app/zuwendungen/page.tsx`

- [ ] **Step 1: Read the current file to identify exact elements**

Read `app/zuwendungen/page.tsx` and find:
1. The page title `<h2>` — add `data-tour="zuwendung-titel"`
2. The "+ Neue Zuwendung" button — add `data-tour="btn-neue-zuwendung"`
3. The `<ZuwendungTabelle>` component — wrap with `<div data-tour="zuwendung-tabelle">`

Apply the same pattern as Task 9.

- [ ] **Step 2: Add the attributes**

Follow the same approach as the spender page — add `data-tour` attributes to the identified elements.

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit app/zuwendungen/page.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/zuwendungen/page.tsx
git commit -m "feat(hilfe): add data-tour attributes to zuwendungen page"
```

---

## Task 11: Add `data-tour` Attributes to Bestätigung Page

**Files:**
- Modify: `app/bestaetigung/page.tsx`

- [ ] **Step 1: Read the current file to identify tab buttons and key elements**

Read `app/bestaetigung/page.tsx` and find:
1. The three tab buttons (Einzelbestätigung, Sammelbestätigung, Vereinfacht) — add `data-tour="tab-einzel"`, `data-tour="tab-sammel"`, `data-tour="tab-vereinfacht"`
2. The spender selection dropdown/field — add `data-tour="bestaetigung-spender"`
3. The download button area — add `data-tour="bestaetigung-download"`

- [ ] **Step 2: Add the attributes**

Apply `data-tour` attributes to the identified elements.

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit app/bestaetigung/page.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/bestaetigung/page.tsx
git commit -m "feat(hilfe): add data-tour attributes to bestaetigung page"
```

---

## Task 12: Add `data-tour` Attributes to Einrichtung Page

**Files:**
- Modify: `app/einrichtung/page.tsx`

- [ ] **Step 1: Read the current file to identify wizard and tab elements**

Read `app/einrichtung/page.tsx` and find:
1. The setup wizard component or container — add `data-tour="setup-wizard"`
2. Wizard step sections/tabs if visible — add `data-tour="setup-basisdaten"`, `data-tour="setup-steuer"`, `data-tour="setup-unterschrift"`
3. The Nutzer tab button — add `data-tour="tab-nutzer"`

Note: The setup wizard might be in a separate component (`VereinsSetupWizard`). If the `data-tour` attributes need to go on sub-component elements, add them there. Read the file first to determine the correct approach.

- [ ] **Step 2: Add the attributes**

Apply `data-tour` attributes to the identified elements.

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit app/einrichtung/page.tsx`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/einrichtung/page.tsx
git commit -m "feat(hilfe): add data-tour attributes to einrichtung page"
```

---

## Task 13: Add New HilfeHint Placements

**Files:**
- Modify: Various page/component files where extended hints are placed

- [ ] **Step 1: Identify exact files for new HilfeHint placements**

Read these files to find the exact form fields:
- Einrichtung wizard component (for Freistellungsdatum, Aktenzeichen, Letzte Veranlagung fields)
- Zuwendung form component (for Sachzuwendung fields: Alter, Zustand, Kaufpreis)
- Bestätigung page (for tab explanations)
- CSV import component (for format hint)

Use `grep -r "HilfeHint" --include="*.tsx"` to find existing HilfeHint usages and follow the same pattern.

- [ ] **Step 2: Add HilfeHint with extended props at each location**

Example placements:

For Freistellungsdatum label:
```tsx
<HilfeHint
  text="Datum des letzten Freistellungsbescheids vom Finanzamt."
  faqId="freistellung-gueltigkeit"
  beispiel="z.B. 15.03.2023"
/>
```

For Sachzuwendung Wert field:
```tsx
<HilfeHint
  text="Der geschätzte aktuelle Wert des Gegenstands. Muss nachvollziehbar sein."
  faqId="sachspenden-steuer"
  beispiel="z.B. 250,00 €"
/>
```

For Bestätigung tab area:
```tsx
<HilfeHint
  text="Einzelbestätigung für eine Zuwendung, Sammelbestätigung für mehrere im Zeitraum, Vereinfacht für Beträge bis 300 €."
  faqId="vereinfacht"
/>
```

For CSV-Import:
```tsx
<HilfeHint
  text="CSV mit Semikolon oder Komma als Trennzeichen. Pflicht: Vorname, Nachname, Strasse, PLZ, Ort."
  faqId="csv-import"
  beispiel="Vorname;Nachname;Strasse;PLZ;Ort"
/>
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(hilfe): add extended HilfeHint placements with faqId and beispiel"
```

---

## Task 14: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entries under `## [Unreleased]`**

Add under the `### Added` section:

```markdown
### Added
- Umfassendes Hilfe-System mit 4 Komponenten: FAQ-Seite, Hilfe-Drawer, Guided Tours, erweiterte HilfeHints
- `lib/hilfe-content.ts`: Zentraler Content-Store mit 45 FAQ-Einträgen in 8 Kategorien und 4 Guided Tours
- `lib/fuzzy-search.ts`: Trigram-basierte Fuzzy-Suche (Eigenimplementierung, keine externe Library)
- `components/HilfeDrawer.tsx`: Kontextuelles Hilfe-Panel (slide-in von rechts) mit seitenspezifischen FAQ-Einträgen
- `components/GuidedTour.tsx`: Guided-Tour-Overlay mit Spotlight, Tooltip-Stepper und localStorage-Flags
- `components/HilfeSystem.tsx`: Wrapper-Komponente für Drawer↔Tour-Kommunikation
- Floating "?"-Button auf allen authentifizierten Seiten (DRK-Rot, unten rechts)
- Automatische Tour-Einladung beim ersten Seitenbesuch mit Ja/Nein-Dialog
- `data-tour`-Attribute an Spender-, Zuwendungen-, Bestätigung- und Einrichtung-Seiten
- CSS-Animationen: `drk-drawer-enter`, Tour-Overlay und Spotlight-Klassen

### Changed
- `/hilfe`-Seite komplett überarbeitet: 8 Kategorien mit Icons, Fuzzy-Suche, URL-Parameter (`?q=`, `?kategorie=`)
- `HilfeHint`-Komponente erweitert um optionale Props `faqId` (FAQ-Verlinkung) und `beispiel` (Beispielwert-Box), abwärtskompatibel
- `app/layout.tsx`: `HilfeSystem` (Drawer + Tour) eingebunden
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for hilfe-system feature"
```

---

## Task 15: Final Build Verification

- [ ] **Step 1: Run full build**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds with no errors

- [ ] **Step 2: Start dev server and verify key pages**

Run: `npx next dev &`

Check these URLs manually:
- `http://localhost:3000/hilfe` — Categories render, search works, details expand
- Login, navigate to `/spender` — Floating "?" button visible, drawer opens with spender-specific FAQ
- Drawer "Tour starten" button visible on pages with tours
- HilfeHint components show extended features where placed

- [ ] **Step 3: Kill dev server and commit any fixes**

If any fixes were needed, commit them:
```bash
git add -A
git commit -m "fix(hilfe): address issues found during manual verification"
```
