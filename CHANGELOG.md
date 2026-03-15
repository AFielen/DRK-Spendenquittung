# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

### Added
- **API-Schlüssel-System:** Nutzer (Admin/Schatzmeister) können API-Schlüssel erstellen, um externen Anwendungen REST-API-Zugriff zu gewähren
- **Öffentliche REST-API** unter `/api/v1/` mit Bearer-Token-Authentifizierung für Spender, Zuwendungen und Kreisverband-Daten
- **API-Schlüssel-Verwaltung:** Neue Seite `/api-schluessel` zum Erstellen, Anzeigen und Löschen von API-Schlüsseln
- **API-Dokumentation:** Öffentliche Seite `/api-dokumentation` mit vollständiger Endpunkt-Referenz und curl-Beispielen
- **Berechtigungssystem:** Granulare Scopes (`spender:read`, `spender:write`, `zuwendungen:read`, `zuwendungen:write`, `kreisverband:read`)
- **Rate Limiting:** 100 Anfragen/Minute pro API-Schlüssel mit `X-RateLimit-*` Response-Headers
- `ApiKey` Prisma-Modell mit SHA-256-Hash, Prefix, Berechtigungen, optionalem Ablaufdatum
- `lib/api-key.ts`: API-Schlüssel-Generierung (`sq_live_*`) und Validierung
- `lib/api-key-types.ts`: Scope-Definitionen und ApiKeyContext-Interface
- `lib/rate-limit.ts`: In-Memory Rate Limiter
- `lib/api-v1-helpers.ts`: Wrapper für API-Key-Auth, Rate Limiting und Scope-Prüfung
- API-Routes: `/api/api-schluessel` (Verwaltung), `/api/v1/spender`, `/api/v1/zuwendungen`, `/api/v1/kreisverband`
- Navigation: "API"-Link mit Schlüssel-Icon
- Datenschutz: Abschnitt über API-Schlüssel-Datenverarbeitung
- **Belegfunktion nur in Web-App:** PDF/DOCX-Erstellung, Bestätigung und Export bewusst nicht in der API
- `lib/docx-templates/briefbogen.ts`: Shared DOCX-Briefbogen-Helper (Header, Footer, Doppel-Paragraph) für einheitliches Layout
- **Admin-Dashboard:** KV-übergreifendes Superadmin-Dashboard unter `/admin` mit Übersicht, Statistiken, Nutzer- und Daten-Verwaltung
- **Superadmin-Auth:** `isSuperadmin()` in `lib/auth.ts` – Erkennung via `SUPERADMIN_EMAIL` Env-Variable (kein DB-Feld)
- **Admin-API-Routes:** `/api/admin/stats`, `/api/admin/kreisverband`, `/api/admin/nutzer` mit serverseitiger Superadmin-Prüfung
- **Admin-Seiten:** `app/admin/page.tsx` (Dashboard), `app/admin/kreisverband/[id]/page.tsx` (KV-Detail), `app/admin/nutzer/page.tsx` (Nutzerverwaltung)
- **Admin-Komponenten:** `AdminGuard.tsx`, `AdminNav.tsx` – Zugangsschutz und Sub-Navigation
- **PDF-Export:** Server-seitige PDF-Generierung mit DRK-Briefbogenlayout via `pdfmake` (`lib/pdf-templates/`)
- **PDF-Templates:** Geldzuwendung, Sachzuwendung, Sammelbestätigung, Vereinfachter Nachweis, Empfangsbestätigung als PDF
- **Briefbogen-Layout:** DRK-Logo oben rechts, rechte Seitenleiste mit Vereinsdaten, Falzmarken (DIN 5008), Seitenfuß
- **API-Route:** `POST /api/dokumente/pdf` für server-seitige PDF-Generierung
- **FormatToggle-Komponente:** Umschalter PDF/DOCX auf Bestätigungs- und Export-Seite (PDF als Standard)
- `lib/pdf-templates/briefbogen.ts`: Briefbogen-Layout-Engine (Logo, Sidebar, Falzmarken, Footer)
- `lib/pdf-templates/pdf-helper.ts`: Shared Hilfsfunktionen (Buffer-Generierung, Formatierung)
- `components/FormatToggle.tsx`: Segment-Control für Formatauswahl
- `components/ZuwendungDetails.tsx`: Read-only Detailansicht für bestätigte Zuwendungen mit PDF-Download

### Changed
- **PDF-Briefbogen:** Komplett-Redesign als professioneller Report-Stil – DRK-Logo links + Org-Name rechts, rote Akzentlinie (#e30613), symmetrische Seitenränder (keine Sidebar mehr), Absenderzeile im Briefkopf-Fenster, Datum rechts, Footer mit roter Linie + Org-Details + VR + StNr + Seitenzahl
- **PDF-Templates:** Aussteller-Block aus allen 5 Templates entfernt (wird nun zentral vom Briefbogen-Layout gerendert)
- **DOCX-Templates:** Alle 5 DOCX-Templates auf PDF-Briefbogen-Layout adaptiert – Logo + Org-Name, rote Akzentlinie, Absenderzeile, Empfänger, Datum, Footer mit Org-Details

### Fixed
- **PDF-Checkboxen:** Unicode ☑/☐ durch [X]/[ ] ersetzt – Helvetica unterstützt keine Unicode-Checkboxen (wurden als && dargestellt)
- **Admin-Navigation:** Admin-Link von der Hauptnavigation ins UserMenu-Dropdown verschoben (Shield-Icon + "Admin-Bereich", nur für Superadmin)
- `app/bestaetigung/page.tsx`: FormatToggle integriert, PDF-Download über API, dynamische Button-Labels
- `app/export/page.tsx`: FormatToggle integriert, Batch-Export unterstützt PDF und DOCX
- `app/zuwendungen/page.tsx`: Details-Ansicht + PDF-Download für bestätigte Zuwendungen
- `components/ZuwendungTabelle.tsx`: Bestätigte Zuwendungen zeigen "Details" statt "Bearbeiten", kein Löschen/Bearbeiten mehr möglich

### Fixed
- **PDF-Download:** `pdfmake` zu `serverExternalPackages` in `next.config.ts` hinzugefügt — behebt Runtime-Fehler durch fehlerhaftes Bundling von Node.js-APIs (`fs`, `path`)
- **PDF-API:** Fehlendes `zugangsweg`-Feld in `mapZuwendung` ergänzt (`app/api/dokumente/pdf/route.ts`)
- **Security:** Magic Codes werden jetzt als SHA-256-Hash in der DB gespeichert statt im Klartext (`auth/login`, `auth/verify`)
- **Security:** Rate-Limiting bei Magic-Code-Verifikation – max. 5 Fehlversuche, danach Code invalidiert (`auth/verify`, `magicCodeVersuche` Feld)
- **Security:** Rollenprüfung (`requireSchreibrecht`) für alle schreibenden Spender- und Zuwendungen-Endpunkte – `leser`-Rolle kann nicht mehr ändern/löschen
- **Security:** `IRON_SESSION_PASSWORD` Fallback wirft Fehler in Production statt unsicheres Default-Passwort zu verwenden (`lib/auth.ts`)
- `.env.example` aktualisiert: Fehlende Variablen `IRON_SESSION_PASSWORD`, `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `APP_URL` ergänzt; veraltete `SESSION_SECRET`/SMTP-Variablen ersetzt

### Added
- `lib/auth.ts`: `requireSchreibrecht()` Helper-Funktion für Rollenprüfung (admin/schatzmeister)
- `prisma/schema.prisma`: `magicCodeVersuche` Feld auf `Nutzer`-Modell für Rate-Limiting
- `prisma/migrations/20260315_add_magic_code_versuche`: DB-Migration für Fehlversuche-Zähler
- Opportunistisches Cleanup abgelaufener Magic Codes und Registrierungscodes beim Login (`auth/login`)

### Changed
- `ZuwendungFormular.tsx`: Redundantes Feld "Zahlungsart" entfernt und in "Zugangsweg" zusammengeführt; neue Option "Lastschrift" im Zugangsweg
- `Spendenbuch.tsx`: "Lastschrift" als Zugangsweg-Option in Labels und Filtern ergänzt

### Removed
- `zahlungsart`-Feld aus Zuwendung (Schema, Types, API, Formular) – ersetzt durch `zugangsweg`
- Prisma-Migration `remove_zahlungsart`: Bestehende Zahlungsart-Werte werden automatisch in Zugangsweg übertragen

### Fixed
- `app/bestaetigung/page.tsx`: Tab-Buttons (Einzel/Sammel/Vereinfacht) werden auf Mobile vertikal gestapelt statt überlappend (`grid-cols-1 sm:grid-cols-3`)
- `app/export/page.tsx`: Gesamtsumme im Batch-Export bricht nicht mehr über zwei Zeilen (`text-lg sm:text-2xl`, `whitespace-nowrap`)

### Added
- `app/login/page.tsx`: Info-Box auf der Anmeldeseite erklärt den Erstanmeldeprozess (KV anlegen, Daten hinterlegen, Mitarbeiter einladen)

### Changed
- `ZuwendungFormular.tsx`: Wizard-Pattern statt scrollendem Modal (Geld: 2 Schritte, Sach: 3 Schritte) mit Step-Indikator
- CSS-Variablen `--error`, `--error-bg`, `--error-border`, `--error-text`, `--info-border`, `--info-text`, `--warning-border`, `--warning-text` in `globals.css` (light + dark mode)
- Hardcodierte Hex-Farben durch CSS-Variablen ersetzt in `ZweckbindungsStatus.tsx`, `Fristwarnung.tsx`, `Spendenbuch.tsx`, `ZuwendungTabelle.tsx`, `SpenderTabelle.tsx`
- `SpenderFormular.tsx`: PLZ-Grid von `grid-cols-3` auf `grid-cols-[5rem_1fr]` (feste PLZ-Breite, flexibler Ort)
- `CsvImport.tsx`: `max-h-[90vh] overflow-y-auto` auf Modal-Container

### Added
- Spendenbuch: Chronologisches Journal aller Zuwendungen mit Filtern nach Jahr, Art, Zugangsweg, Status (SAC II.1–II.6)
- Zugangsweg-Erfassung bei Geldzuwendungen (Überweisung, Bar, Online, PayPal, Scheck, Sonstig) mit `zugangsweg`-Feld in Schema, Types, API, Formular
- Sachspenden-Bewertungsdokumentation: Strukturierte Erfassung der Bewertungsgrundlage (`sachBewertungsgrundlage`) mit Plausibilitätsprüfungen (SAC IV.3)
- Zweckbindungs-Tracking: `zweckgebunden`, `zweckbindung`, `zweckVerwendet`, `zweckVerwendetDatum`, `zweckVerwendetNotiz` Felder (SAC III.2, III.3)
- `components/ZweckbindungsStatus.tsx`: Dashboard-Karte für offene zweckgebundene Zuwendungen mit Farbcodierung und "Als verwendet markieren"-Funktion
- Fristüberwachung: `components/Fristwarnung.tsx` – Automatische Ampel für die Zwei-Jahres-Verausgabungsfrist nach § 55 Abs. 1 Nr. 5 AO (SAC III.4)
- Empfangsbestätigung: `lib/docx-templates/empfangsbestaetigung.ts` – DOCX-Übergabeprotokoll für Sachspenden (internes Dokument)
- `app/api/zuwendungen/[id]/zweck-verwendet/route.ts`: API-Endpoint zum Markieren von Zweckbindungen als verwendet
- `app/spendenbuch/page.tsx` + `components/Spendenbuch.tsx`: Spendenbuch-Seite mit Zusammenfassung und Filtern
- Prisma-Migrationen: `add_zugangsweg`, `add_sach_bewertungsgrundlage`, `add_zweckbindung`

### Changed
- `ZuwendungFormular.tsx`: Erweiterte Sachspenden-Felder mit Bewertungsblock (Bewertungsgrundlage, Plausibilitätsprüfungen, Betriebsvermögen-Hinweis), Zweckbindungs-Checkbox
- Dashboard (`app/page.tsx`): Neue Karten für Zweckbindungen (`ZweckbindungsStatus`) und Fristwarnungen (`Fristwarnung`)
- `Navigation.tsx`: Neuer Menüpunkt "Spendenbuch" (book-open Icon) zwischen Zuwendungen und Bestätigung
- `ZuwendungTabelle.tsx`: "Empfangsbestätigung"-Download-Button für Sachspenden
- Batch-Export (`app/export/page.tsx`): Optionaler Export von Empfangsbestätigungen für Sachspenden in Unterordner `Empfangsbestaetigungen/`
- API `GET /api/zuwendungen`: Neue Filter `zugangsweg` und `status=zweckgebunden_offen`
- API `POST/PUT /api/zuwendungen`: Neue Felder `zugangsweg`, `sachBewertungsgrundlage`, `zweckgebunden`, `zweckbindung`, `zweckVerwendet`, `zweckVerwendetDatum`, `zweckVerwendetNotiz`

- Firmenspender: `istFirma` und `firmenname` Felder in `Spender`-Modell, Formular, Tabelle, API und DOCX-Templates
- `components/HilfeHint.tsx`: Wiederverwendbare Hilfe-Hinweis-Komponente mit Toggle
- Hilfe-Hints bei allen steuerlichen Feldern im `VereinsSetupWizard` (Finanzamt, Steuernummer, Freistellungsart, Bescheiddatum, Veranlagungszeitraum, Begünstigte Zwecke, Unterschrift)
- Erklärungstexte unter Freistellungsart-Optionen (Freistellungsbescheid vs. Feststellungsbescheid)
- Archivierte Belege: Aufklappbare Ansicht bestätigter Zuwendungen auf der Bestätigungsseite (read-only)
- `lib/docx-templates/default-logo.ts`: DRK-Kompaktlogo als Standard-Logo für Zuwendungsbestätigungen
- `lib/types.ts`: `spenderAnzeigename()` Hilfsfunktion für einheitliche Namensanzeige
- `prisma/migrations/20260314_add_company_donors/migration.sql`: DB-Migration für Firmenspender
- Optionales `bemerkung`-Feld auf Zuwendung für interne Notizen/Verwendungszweck (Schema, Types, API, Formular, Tabelle)
- `prisma/migrations/20260314_add_bemerkung/migration.sql`: DB-Migration für Bemerkungsfeld

### Fixed
- `HilfeHint.tsx`: Mobile-Darstellung als Bottom-Sheet-Overlay statt absolut positioniertem Tooltip (verhindert Viewport-Overflow)
- `ZuwendungFormular.tsx`: Spendersuche setzt Auswahl korrekt zurück beim Tippen (State-Management-Bug)
- DOCX-Datumsformatierung: ISO-Datetime-Strings (`2026-03-14T00:00:00.000Z`) werden korrekt auf `14.03.2026` formatiert (alle 4 Templates)
- Bestätigungsseite: Tab-Buttons überlappen nicht mehr auf Mobile (`min-w-0` statt `whitespace-nowrap`)
- Bestätigungsseite: DOCX-Download funktioniert jetzt auf iOS Safari (eigene `downloadBlob`-Funktion statt `file-saver`)

### Changed
- Header: Responsive Anpassung für Mobile (kleinere Schrift, `truncate`, reduziertes Padding)
- Bestätigungsseite: Tabs responsive mit `overflow-x-auto`, kleinere Schrift auf Mobile
- DOCX-Templates: Verwenden DRK-Kompaktlogo als Standard wenn kein eigenes Logo hochgeladen
- DOCX-Templates: Unterstützung für Firmenspender (Firmenname statt Vor-/Nachname)
- `SpenderFormular.tsx`: Toggle Privatperson/Firma mit angepassten Pflichtfeldern
- `SpenderTabelle.tsx`: Firmenname-Anzeige mit Ansprechpartner-Info
- `ZuwendungTabelle.tsx`, `ZuwendungFormular.tsx`: Verwenden `spenderAnzeigename()`
- `app/export/page.tsx`: Dateinamen und CSV mit `spenderAnzeigename()`
- `VereinsSetupWizard.tsx`: Hinweis bei Logo-Upload dass DRK-Kompaktlogo Standard ist

### Added (vorherige Einträge)
- `app/registrierung/page.tsx`: Selbstregistrierungsseite mit 4-Schritt-Wizard (Konto → Stammdaten → Steuer → Unterschrift)
- `app/api/auth/registrierung/route.ts`: API-Route für Selbstregistrierung (send-code + verify-and-create)
- `lib/domain-check.ts`: Domain-Validierung für `@drk-*.de` E-Mail-Adressen
- `lib/mail.ts`: `sendInvitationEmail()` für Einladungs-E-Mails via Mailjet
- `prisma/schema.prisma`: `RegistrierungCode`-Modell für temporäre Verifizierungscodes
- Link von `/login` zu `/registrierung` ("Verband registrieren")
- Domain-Validierung `@drk-*.de` bei Nutzereinladung (`POST /api/nutzer`)
- Einladungs-E-Mail wird automatisch bei Nutzeranlage versendet
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
