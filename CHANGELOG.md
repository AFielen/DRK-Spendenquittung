# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

### Added
- `components/ThemeToggle.tsx`: Dark/Light/System-Farbschema-Umschalter im Header (Sonne/Mond/Monitor-Icons)
- Dark Mode CSS-Variablen in `globals.css` via `.dark`-Klasse + System-Präferenz-Fallback
- FOUC-Prevention-Script in `layout.tsx` für flackerfreien Themenwechsel
- `prisma/schema.prisma`: PostgreSQL-Schema mit 4 Modellen (Kreisverband, Nutzer, Spender, Zuwendung)
- `lib/db.ts`: PrismaClient-Singleton mit `@prisma/adapter-pg` und `pg` Pool
- `lib/auth.ts`: iron-session-basierte Session-Verwaltung (getSession, createSession, destroySession)
- `lib/mail.ts`: Magic-Link E-Mail-Versand via Mailjet SMTP (nodemailer)
- `lib/api-client.ts`: Client-seitige API-Abstraction (apiGet, apiPost, apiPut, apiDelete) mit 401-Redirect
- `components/AuthProvider.tsx`: React Context für Auth-State (nutzer, kreisverband, loading, logout, refresh)
- `components/AuthGuard.tsx`: Route-Protection — Redirect zu /login bei fehlender Authentifizierung
- `components/Navigation.tsx`: Horizontale Sub-Navigation mit 7 Routes und SVG-Icons
- `components/AppShell.tsx`: Client-Wrapper für Header, Navigation, UserMenu, ThemeToggle
- `components/UserMenu.tsx`: Initialen-Badge + Dropdown mit Nutzer/KV-Info und Logout
- `app/login/page.tsx`: Zwei-Schritt-Login (E-Mail → 6-stelliger Code) mit Auto-Advance
- API-Routes: auth/login, auth/verify, auth/logout, auth/me
- API-Routes: kreisverband (GET/PUT), kreisverband/laufendeNr (POST, atomare Transaction)
- API-Routes: spender (GET mit Aggregation, POST), spender/[id] (GET/PUT/DELETE), spender/import (POST)
- API-Routes: zuwendungen (GET mit Filter, POST), zuwendungen/[id] (GET/PUT/DELETE), zuwendungen/[id]/bestaetigen (POST)
- API-Routes: nutzer (GET/POST/DELETE, admin-only)
- `prisma/seed.ts`: Seed-Script mit Demo-Kreisverband und Admin-Nutzer
- `.env.example`: Vorlage für Umgebungsvariablen (DB, Session, SMTP)
- Dependencies: `@prisma/adapter-pg`, `pg`, `@types/pg`, `iron-session`, `nodemailer`, `prisma`, `tsx`
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
- `components/CsvImport.tsx`: CSV-Import (server-seitig) mit Duplikat-Erkennung
- `components/ZuwendungTabelle.tsx`: Filterable Tabelle (Spender, Jahr, Art, Status) mit Summenzeile
- `components/ZuwendungFormular.tsx`: Modal mit Geld/Sach-Toggle, Aufwandsverzicht-Info, Sachspenden-Hinweise
- `components/FreistellungsBlocker.tsx`: Vollbild-Blocker bei abgelaufenem Bescheid, Warnung bei < 6 Monate
- `components/UnterschriftHinweis.tsx`: Modal vor jedem Download mit Doppel-Checkbox
- `components/StatistikKarten.tsx`: Dashboard-Karten (Spender, Jahressumme, Offene, Anzahl) + CSS-Balkendiagramm

### Changed
- `app/layout.tsx`: AuthProvider + AppShell-Wrapper, Header/Navigation in Client-Komponente verschoben
- `app/page.tsx`: Dashboard mit API-Anbindung statt localStorage, AuthGuard
- `app/spender/page.tsx`: Spenderverwaltung mit API-Anbindung
- `app/zuwendungen/page.tsx`: Zuwendungserfassung mit API-Anbindung
- `app/bestaetigung/page.tsx`: Bestätigungen mit API-Anbindung, laufende Nr. via API-Transaction
- `app/export/page.tsx`: Batch-Export mit API-Datenquelle, DOCX weiterhin clientseitig
- `app/daten/page.tsx`: Vereinfacht auf Statistik + Admin-Löschfunktion
- `app/einrichtung/page.tsx`: Admin-only mit Tabs: Vereinsdaten + Nutzerverwaltung
- `app/datenschutz/page.tsx`: Aktualisiert für DB-Architektur, Session-Cookie, Mailjet, Mandantenisolation
- `app/hilfe/page.tsx`: Neue FAQs zu Login, Datenspeicherung, Mehrbenutzer-Betrieb
- `lib/types.ts`: `AppSettings` entfernt, `Verein.letzterVZ` (vorher `letzterVeranlagungszeitraum`), nullable Felder
- `Dockerfile`: Prisma-Generate-Step hinzugefügt, Prisma-Dateien in Runner-Stage kopiert
- `docker-compose.yml`: PostgreSQL-Service, Health-Check, Umgebungsvariablen
- `package.json`: Neue Scripts (db:migrate, db:seed), prisma seed-Konfiguration
- DOCX-Templates: `letzterVeranlagungszeitraum` → `letzterVZ` in allen Templates

### Removed
- `lib/storage.ts`: localStorage-Abstraktion (ersetzt durch PostgreSQL + API)
- `components/BackupStatusAnzeige.tsx`: Backup-Ampel (nicht mehr nötig mit serverseitiger DB)

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
