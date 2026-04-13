# Hilfe-System Design — Spendenquittung

**Datum:** 2026-04-13
**Status:** Approved

## Problemstellung

Die aktuelle `/hilfe`-Seite hat 10 FAQ-Einträge auf einer einzigen Seite. Für eine App mit 10+ Features (Spenderverwaltung, 3 Zertifikatstypen, CSV-Import, Batch-Export, API-Schlüssel, Einrichtungs-Wizard, Freistellungs-Prüfung) ist das unzureichend. Nutzer finden Antworten nicht schnell genug und erhalten keine kontextuelle Hilfe dort, wo sie gerade arbeiten.

## Zielgruppe

Ehrenamtliche Schatzmeister und Kassenführer in DRK-Kreisverbänden. Wenig technischer Hintergrund, nutzen die App selten (oft nur einmal jährlich für die Zuwendungsbestätigungen). Die Hilfe muss einfach, verständlich und proaktiv sein.

## Architektur-Ansatz: Modulares Hilfe-System

Separate, fokussierte Komponenten die über einen zentralen Content-Store zusammenspielen. Kein Eingriff in bestehende API-Routes, Datenbank, Authentifizierung oder Geschäftslogik.

---

## 1. Zentraler Content-Store (`lib/hilfe-content.ts`)

Alle Hilfe-Inhalte leben in einer einzigen Datei. Ein neuer FAQ-Eintrag an einer Stelle hinzufügen → er erscheint automatisch auf der `/hilfe`-Seite, im Drawer der passenden Seiten und ist durchsuchbar.

### Typen

```typescript
interface HilfeEintrag {
  id: string;                    // z.B. "zertifikat-unterschrift"
  kategorie: HilfeKategorie;
  frage: string;
  antwort: string;               // Reines HTML (kein Markdown, kein Parser nötig)
  tags: string[];                // Synonyme/Stichworte für Fuzzy-Suche
  seiten: string[];              // Auf welchen Routen relevant: ["/bestaetigung", "/export"]
}

type HilfeKategorie =
  | 'erste-schritte'
  | 'spenderverwaltung'
  | 'zuwendungen'
  | 'zuwendungsbestaetigungen'
  | 'freistellung-steuern'
  | 'export-archivierung'
  | 'api-integration'
  | 'sicherheit-datenschutz';

interface KategorieInfo {
  id: HilfeKategorie;
  titel: string;
  beschreibung: string;
  icon: string;                  // SVG-Path oder Inline-SVG-Komponent
}
```

### Kategorien (8 Stück)

| ID | Titel | Beschreibung |
|---|---|---|
| `erste-schritte` | Erste Schritte | Login, Einrichtung, Rollen |
| `spenderverwaltung` | Spenderverwaltung | Anlegen, Bearbeiten, CSV-Import, Archivieren |
| `zuwendungen` | Zuwendungen | Geld-/Sachspenden erfassen, Zweckbindung |
| `zuwendungsbestaetigungen` | Zuwendungsbestätigungen | Einzel, Sammel, Vereinfacht, PDF/DOCX, Unterschrift |
| `freistellung-steuern` | Freistellung & Steuern | Gültigkeit, Ablauf, Prüfung, gesetzliche Grundlagen |
| `export-archivierung` | Export & Archivierung | Batch-Export, Doppel, Aufbewahrungsfristen |
| `api-integration` | API & Integration | API-Schlüssel, Scopes, Nutzung |
| `sicherheit-datenschutz` | Sicherheit & Datenschutz | Daten, DSGVO, Löschung |

### Content-Umfang

- ~40-50 FAQ-Einträge über die 8 Kategorien (aktuell 10)
- 4 Guided Tours mit je 5-8 Steps
- ~15-20 neue/erweiterte HilfeHint-Platzierungen

---

## 2. Kategorisierte FAQ-Seite (`/hilfe`)

Kompletter Rewrite der bestehenden Seite.

### Aufbau (von oben nach unten)

1. **Header** — Titel "Hilfe & Anleitung" mit Untertitel
2. **Suchfeld** — Prominent oben, Fuzzy-Suche filtert live beim Tippen über Fragen, Antworten und Tags. Zeigt Treffer kategorie-übergreifend mit Highlight der Matches.
3. **Kategorie-Karten** — 8 Karten im Grid (2x4 Desktop, 1x8 Mobile), jeweils mit Icon, Titel und Anzahl der Einträge. Klick scrollt zur Kategorie oder filtert die Ansicht.
4. **FAQ-Bereiche** — Pro Kategorie eine Sektion mit Überschrift und `<details>`-Elementen. Beim Suchen werden nur passende Einträge angezeigt, der Suchbegriff wird in der Frage hervorgehoben.
5. **Kontaktbox** — Unten: `digitalisierung@drk-aachen.de`

### Fuzzy-Suche (`lib/fuzzy-search.ts`)

Eigenimplementierung ohne externe Library:

- **Trigram-basiert:** Suchbegriff wird in 3-Zeichen-Stücke zerlegt und gegen Frage + Antwort + Tags geprüft
- **Fehlertoleranz:** 1-2 Zeichen Abweichung toleriert (z.B. "Freistelung" findet "Freistellung")
- **Relevanz-Sortierung:** Treffer in Frage > Tags > Antwort
- **Performance:** Alles Client-seitig, kein Backend nötig

### URL-Parameter

- `?q=suchbegriff` — Vorausgefüllte Suche (für Verlinkung aus Drawer/Hints)
- `?kategorie=export-archivierung` — Vorausgewählte Kategorie

---

## 3. Hilfe-Drawer (`HilfeDrawer.tsx`)

Seitliches Panel, auf jeder authentifizierten Seite verfügbar.

### Trigger

- Fester "?"-Button, `position: fixed`, unten rechts
- Rund, DRK-Rot (#e30613), 48x48px, Fragezeichen-SVG
- Nur auf authentifizierten Seiten sichtbar (nicht auf `/login`, `/impressum`, `/datenschutz`, `/spenden`, `/registrierung`)

### Panel-Verhalten

- Von rechts einfahrend, 380px breit (Desktop), volle Breite (Mobile)
- Halbtransparenter Backdrop
- Schließbar via: X-Button, Backdrop-Klick, Escape-Taste
- Focus-Trap (bestehender `useFocusTrap`-Hook)
- Animation: `transform: translateX()`, CSS-Transition 200ms ease-out

### Inhalt

1. **Titel** — "Hilfe zu dieser Seite" mit aktuellem Seitennamen
2. **Tour-Button** — Falls Guided Tour für diese Seite existiert: "Tour starten"-Button
3. **Kontext-FAQ** — Nur FAQ-Einträge, deren `seiten`-Array die aktuelle Route enthält. Kompakte `<details>`-Liste.
4. **Link zur vollen Hilfe** — "Alle Hilfe-Themen → /hilfe"

### Seiten-Erkennung

- `usePathname()` aus Next.js liefert die aktuelle Route
- Abgleich gegen `seiten`-Arrays im Content-Store
- Fallback ohne passende Einträge: Allgemeine Kurzanleitung + Link zu `/hilfe`

---

## 4. Guided Tours (`GuidedTour.tsx`)

Wiederverwendbare Tour-Komponente, die Elemente auf der Seite hervorhebt und erklärt.

### Tour-Typen

```typescript
interface TourStep {
  target: string;        // CSS-Selektor: "[data-tour='spender-neu']"
  titel: string;
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface Tour {
  id: string;            // z.B. "einrichtung"
  seite: string;         // Route: "/einrichtung"
  titel: string;
  steps: TourStep[];
}
```

### Vier Tours

| Tour | Seite | Inhalt |
|---|---|---|
| `einrichtung` | `/einrichtung` | 3 Wizard-Steps erklärt (Basisdaten, Steuer-Rechtliches, Unterschrift) |
| `spender` | `/spender` | Spender anlegen, Suche, CSV-Import, Archiv |
| `zuwendungen` | `/zuwendungen` | Zuwendung erfassen (Geld/Sach), Zweckbindung, Status |
| `bestaetigung` | `/bestaetigung` | 3 Tabs (Einzel, Sammel, Vereinfacht), PDF vs. DOCX, Unterschrift-Hinweis |

### Visuelle Mechanik

- **Spotlight:** Aktuelles Element bekommt hohen `z-index`, Rest mit halbtransparentem Overlay abgedunkelt (`pointer-events: none` auf Overlay)
- **Tooltip-Box:** Weißes Card neben dem Element mit Titel, Text, Schritt-Anzeige ("3 von 7"), Zurück/Weiter/Überspringen-Buttons
- **Scroll:** Automatisches Smooth-Scroll zum nächsten Element falls außerhalb Viewport
- **Responsive:** Auf Mobile immer Bottom-Position für Tooltip-Box

### Auslösung

- **Automatisch:** Beim ersten Besuch einer Seite (Flag in `localStorage`: `tour-{id}-gesehen`). Dialog fragt: "Möchtest du eine kurze Einführung zu dieser Seite?" mit Ja/Nein.
- **Manuell:** "Tour starten"-Button im Hilfe-Drawer, jederzeit wiederholbar

### `data-tour`-Attribute

Bestehende Seiten-Komponenten bekommen `data-tour="..."` Attribute an relevanten Elementen. Das ist die einzige Änderung an bestehenden Komponenten — kein Refactoring nötig.

---

## 5. Erweiterte HilfeHint-Komponente

Bestehende `HilfeHint.tsx` wird erweitert, ohne die bestehende API zu brechen.

### API (abwärtskompatibel)

```typescript
// Bisher — funktioniert weiterhin
<HilfeHint text="Kurze Erklärung zum Feld" />

// Neu — optionale Props
<HilfeHint
  text="Kurze Erklärung zum Feld"
  faqId="freistellung-gueltigkeit"   // Link zum FAQ-Eintrag
  beispiel="z.B. 01.01.2024"         // Beispielwert
/>
```

### Neues Verhalten

- **Ohne neue Props:** Exakt wie bisher (Text-Toggle)
- **Mit `faqId`:** Unter dem Text erscheint "Mehr dazu in der Hilfe"-Link. Klick öffnet den Hilfe-Drawer und scrollt zum FAQ-Eintrag. Auf Mobile: Öffnet `/hilfe?q={frage}` statt Drawer.
- **Mit `beispiel`:** Kleine graue Beispielbox unter dem Erklärungstext

### Neue Platzierungen

| Seite | Felder |
|---|---|
| Einrichtung | Freistellungsdatum, Aktenzeichen, Letzte Veranlagung |
| Zuwendungen | Sachzuwendung-Bewertungsfelder (Alter, Zustand, Kaufpreis) |
| Bestätigung | Tab-Erklärungen (Einzel vs. Sammel vs. Vereinfacht) |
| Spender | CSV-Import-Format-Hinweis |

---

## 6. Dateien-Überblick

### Neue Dateien

```
lib/
  ├── hilfe-content.ts         # Content-Store: FAQ-Einträge, Kategorien, Tours
  └── fuzzy-search.ts          # Trigram-basierte Fuzzy-Suche
components/
  ├── HilfeDrawer.tsx          # Seitliches Hilfe-Panel
  └── GuidedTour.tsx           # Tour-Overlay mit Spotlight + Tooltips
```

### Geänderte Dateien

```
components/
  └── HilfeHint.tsx            # Erweiterte Props (faqId, beispiel)
app/
  ├── layout.tsx               # HilfeDrawer + Floating-Button einbinden
  └── hilfe/page.tsx           # Kompletter Rewrite mit Kategorien + Suche
```

### Bestehende Seiten (minimal)

`data-tour`-Attribute an relevanten Elementen in:
- `app/einrichtung/page.tsx`
- `app/spender/page.tsx` (oder Spender-Komponenten)
- `app/zuwendungen/page.tsx` (oder Zuwendung-Komponenten)
- `app/bestaetigung/page.tsx` (oder Bestätigung-Komponenten)

### Kein Eingriff in

- API-Routes
- Datenbank/Prisma-Schema
- Authentifizierung/Sessions
- Bestehende Geschäftslogik
- Bestehende HilfeHint-Nutzungen (abwärtskompatibel)

---

## 7. Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Kein `fuse.js` oder andere Such-Library | DSGVO/Dependency-Minimierung, Trigram-Suche reicht für ~50 Einträge |
| Kein `react-joyride` oder Tour-Library | Eigene Implementierung, weniger Bundle-Size, volle Kontrolle über DRK-Styling |
| Content als TypeScript-Objekte, nicht Markdown-Dateien | Typsicherheit, IDE-Autocomplete, kein Build-Step für Content |
| `localStorage` für Tour-Flags | Kein Backend nötig, kein Login-Zustand-Abhängigkeit für "gesehen"-Flags |
| URL-Parameter für Suche/Kategorie | Verlinkbarkeit aus Drawer und Hints heraus |
