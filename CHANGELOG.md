# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

### Added
- `components/ThemeToggle.tsx`: Dark/Light/System-Farbschema-Umschalter im Header (Sonne/Mond/Monitor-Icons)
- Dark Mode CSS-Variablen in `globals.css` via `.dark`-Klasse + System-Präferenz-Fallback
- FOUC-Prevention-Script in `layout.tsx` für flackerfreien Themenwechsel
- `lib/types.ts`: Interfaces `Verein`, `Spender`, `Zuwendung`, `AppSettings` nach Konzept-Datenmodell
- `lib/storage.ts`: localStorage-Abstraktion mit CRUD für alle Entitäten, Export/Import, Backup-Tracking
- `lib/freistellung-check.ts`: Prüfung der Freistellungsgültigkeit (5 Jahre / 3 Jahre) mit Ampel-Status
- `lib/docx-templates/shared.ts`: Alle BMF-Pflicht-Textbausteine als typisierte Konstanten (exakter Wortlaut)
- `lib/docx-templates/betrag-in-worten.ts`: Deutsche Zahlwort-Konvertierung für Beträge
- `lib/docx-templates/geldzuwendung.ts`: DOCX-Generator für Anlage 3 (Geldzuwendung/Mitgliedsbeitrag)
- `lib/docx-templates/sachzuwendung.ts`: DOCX-Generator für Anlage 4 (Sachzuwendung)
- `lib/docx-templates/sammelbestaetigung.ts`: DOCX-Generator für Anlage 14 (Sammelbestätigung mit Anlage-Tabelle)
- `lib/docx-templates/vereinfachter-nachweis.ts`: DOCX-Generator für vereinfachten Spendennachweis (≤ 300 €)
- `components/VereinsSetupWizard.tsx`: 3-Schritt-Wizard (Stammdaten, Steuer, Unterschrift) mit Logo-Upload
- `components/SpenderTabelle.tsx`: Sortierbare Tabelle mit Suche, Mobile-Cards, Lösch-Bestätigung
- `components/SpenderFormular.tsx`: Modal-Formular für Spender-CRUD
- `components/CsvImport.tsx`: CSV-Import mit Semikolon/Komma-Erkennung, Duplikat-Prüfung, Vorschau
- `components/ZuwendungTabelle.tsx`: Filterable Tabelle (Spender, Jahr, Art, Status) mit Summenzeile
- `components/ZuwendungFormular.tsx`: Modal mit Geld/Sach-Toggle, Aufwandsverzicht-Info, Sachspenden-Hinweise
- `components/FreistellungsBlocker.tsx`: Vollbild-Blocker bei abgelaufenem Bescheid, Warnung bei < 6 Monate
- `components/UnterschriftHinweis.tsx`: Modal vor jedem Download mit Doppel-Checkbox
- `components/BackupStatusAnzeige.tsx`: Ampel-Status (grün/gelb/rot) basierend auf letztem Backup-Datum
- `components/StatistikKarten.tsx`: Dashboard-Karten (Spender, Jahressumme, Offene, Anzahl) + CSS-Balkendiagramm
- `app/einrichtung/page.tsx`: Vereins-Setup-Seite
- `app/spender/page.tsx`: Spenderverwaltung mit CSV-Import
- `app/zuwendungen/page.tsx`: Zuwendungserfassung
- `app/bestaetigung/page.tsx`: 3-Tab-Bestätigungsseite (Einzel, Sammel, Vereinfacht)
- `app/export/page.tsx`: Batch-Export als ZIP mit Fortschrittsbalken und Pflichthinweis
- `app/daten/page.tsx`: Backup (JSON-Export/Import), Statistik, Gefahrenzone (3-Schritt-Löschung)
- `Dockerfile`: Multi-Stage Docker-Build (Node 22 Alpine)
- `docker-compose.yml`: Docker Compose Service-Konfiguration
- `.dockerignore`: Docker-Ausschluss-Patterns
- Dependencies: `docx`, `file-saver`, `jszip`, `@types/file-saver`

### Changed
- `app/layout.tsx`: Template-Platzhalter durch "DRK Spendenquittung" ersetzt
- `app/page.tsx`: Dashboard mit 3 Zuständen (Erststart, kein Spender, regulärer Betrieb)
- `app/datenschutz/page.tsx`: Zero-Data-Architektur-Erklärung, Hetzner-Hosting, spezifische localStorage-Beschreibung
- `app/hilfe/page.tsx`: 10 spezifische FAQ-Einträge zu Zuwendungsbestätigungen, BMF-Mustern, Freistellung etc.
- `app/impressum/page.tsx`: Metadata-Platzhalter ersetzt
- `app/spenden/page.tsx`: Metadata-Platzhalter ersetzt
- `lib/types.ts`: Template-Typen durch app-spezifische Interfaces ersetzt
- `lib/i18n.ts`: Template-Platzhalter durch app-spezifische Übersetzungen ersetzt
- `lib/version.ts`: Version auf 0.1.0, Name auf "DRK Spendenquittung"
- `next.config.ts`: Output von `'export'` auf `'standalone'` geändert
- `package.json`: Name `drk-spendenquittung`, Version 0.1.0, Beschreibung angepasst
- `README.md`: Vollständig neu geschrieben für DRK Spendenquittung

---

## [1.0.0] – 2026-03-03

### Added
- Initiales DRK App-Template mit Next.js 16, React 19, TypeScript strict, Tailwind CSS 4
- DRK Design-System: CSS-Variablen, Utility-Klassen (`.drk-card`, `.drk-btn-primary` etc.)
- Pflichtseiten: Impressum, Datenschutz, Hilfe, Spenden, 404
- i18n-System (DE/EN) mit shared + app-spezifischen Übersetzungen
- Root-Layout mit DRK-Header (rot) und Footer (hell)
- Animationen: `.drk-fade-in`, `.drk-slide-up`
- Status-Badges: `.drk-badge-success`, `.drk-badge-warning`, `.drk-badge-error`
