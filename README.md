# 🧾 DRK Spendenquittung

**Zuwendungsbestätigungen nach BMF-Muster für DRK-Verbände.**

Open Source · Kostenlos · DSGVO-konform

---

## Was ist das?

Jeder DRK-Kreisverband und Ortsverein muss Spendern steuerlich anerkannte Zuwendungsbestätigungen ausstellen. Das BMF schreibt verbindliche Muster vor — diese App generiert sie automatisch als DOCX-Dokument. Alle Daten bleiben im Browser (Zero-Data-Architektur), keine Datenbank, kein Server-Speicher.

**Zielgruppe:** Schatzmeister, Kassenführer und Verwaltungskräfte in DRK-Kreisverbänden und Ortsvereinen.

## ✨ Features

### Web-App
- **PDF- und DOCX-Export** — BMF-konforme Zuwendungsbestätigungen als PDF (Standard) oder DOCX, Anlagen 3, 4 und 14
- **DRK-Briefbogen-Layout** — PDF mit Logo, Seitenleiste, Falzmarken (DIN 5008) und Seitenfuß
- **Vereins-Setup-Wizard** — Stammdaten, steuerliche Angaben, Unterschrift in 3 Schritten
- **Spenderverwaltung** — CRUD mit Suche, Sortierung und CSV-Import
- **Zuwendungen erfassen** — Geldspenden, Sachspenden, Mitgliedsbeiträge, Aufwandsverzicht
- **Einzelbestätigungen** — Geldzuwendung (Anlage 3) und Sachzuwendung (Anlage 4)
- **Sammelbestätigungen** — Jahressammelbestätigung (Anlage 14) mit Anlage-Tabelle
- **Vereinfachter Nachweis** — Für Zuwendungen ≤ 300 € (§ 50 Abs. 4 EStDV)
- **Batch-Export** — ZIP mit allen Bestätigungen + Doppel + CSV-Übersicht
- **Freistellungs-Blocker** — Automatische Prüfung und Blockierung bei abgelaufenem Bescheid
- **Doppel-Pflicht** — Automatische Erzeugung von Doppeln für die Vereinsakte
- **Backup-Ampel** — Visueller Status im Dashboard, JSON-Export/Import
- **Mobile-First** — Cards statt Tabellen auf Mobilgeräten, 44px Touch-Targets

### Steuerrechtliche Sicherheitsmechanismen
- Exakte BMF-Pflicht-Textbausteine (keine Umformulierungen)
- Freistellungs-Prüfung mit automatischer Blockierung
- Unterschrifts-Hinweis vor jedem Download
- Sachspenden: Unterlagen-Checkbox erzwungen
- Aufwandsverzicht: Warnhinweis zu Voraussetzungen
- Doppel im Batch-Export nicht abwählbar (§ 50 Abs. 7 EStDV)
- Pflicht-Hinweis nach Download mit 5-Sekunden-Timer

## 🚀 Installation

### Docker (empfohlen)

```bash
git clone https://github.com/AFielen/DRK-Spendenquittung.git
cd DRK-Spendenquittung
docker compose up -d --build
```

Die App ist unter `http://localhost:3000` erreichbar.

### Lokal entwickeln

```bash
git clone https://github.com/AFielen/DRK-Spendenquittung.git
cd DRK-Spendenquittung
npm install
npm run dev
```

## 🛠️ Tech-Stack

| Technologie | Version | Zweck |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | App-Framework (App Router, standalone) |
| [React](https://react.dev/) | 19 | UI-Library |
| [TypeScript](https://www.typescriptlang.org/) | strict | Typisierung |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling |
| [pdfmake](https://www.npmjs.com/package/pdfmake) | latest | PDF-Generierung serverseitig |
| [docx](https://www.npmjs.com/package/docx) | latest | DOCX-Generierung clientseitig |
| [file-saver](https://www.npmjs.com/package/file-saver) | latest | Download-Trigger |
| [JSZip](https://www.npmjs.com/package/jszip) | latest | ZIP-Erstellung |

## 📐 Projektstruktur

```
DRK-Spendenquittung/
├── app/
│   ├── layout.tsx               # Root-Layout: DRK-Header + Footer
│   ├── page.tsx                 # Dashboard (3 Zustände)
│   ├── globals.css              # DRK CSS-Variablen + Basis-Styles
│   ├── einrichtung/page.tsx     # Vereins-Setup-Wizard
│   ├── spender/page.tsx         # Spenderverwaltung
│   ├── zuwendungen/page.tsx     # Zuwendungen erfassen
│   ├── bestaetigung/page.tsx    # Bestätigungen erstellen (3 Tabs)
│   ├── export/page.tsx          # Batch-Export (ZIP)
│   ├── daten/page.tsx           # Backup, Statistik, Daten löschen
│   ├── impressum/page.tsx       # Pflicht
│   ├── datenschutz/page.tsx     # Pflicht
│   ├── hilfe/page.tsx           # Pflicht (10 FAQ)
│   └── spenden/page.tsx         # Pflicht
├── components/
│   ├── VereinsSetupWizard.tsx   # 3-Schritt-Wizard
│   ├── SpenderTabelle.tsx       # Tabelle + Mobile-Cards
│   ├── SpenderFormular.tsx      # Modal
│   ├── CsvImport.tsx            # CSV-Import mit Duplikat-Erkennung
│   ├── ZuwendungTabelle.tsx     # Tabelle + Filter
│   ├── ZuwendungFormular.tsx    # Modal mit Geld/Sach-Toggle
│   ├── FreistellungsBlocker.tsx # Ampel + Vollbild-Blocker
│   ├── UnterschriftHinweis.tsx  # Modal vor Download
│   ├── BackupStatusAnzeige.tsx  # Ampel-Status
│   ├── StatistikKarten.tsx      # Dashboard-Karten + Balkendiagramm
│   └── icons/                   # Inline-SVG-Icons
├── lib/
│   ├── types.ts                 # Verein, Spender, Zuwendung, AppSettings
│   ├── storage.ts               # localStorage-Abstraktion
│   ├── freistellung-check.ts    # Freistellungs-Prüfung
│   ├── i18n.ts                  # DE/EN Übersetzungen
│   ├── version.ts               # App-Version
│   └── docx-templates/
│       ├── shared.ts            # BMF-Pflicht-Textbausteine
│       ├── betrag-in-worten.ts  # Zahlwort-Konverter
│       ├── geldzuwendung.ts     # Anlage 3
│       ├── sachzuwendung.ts     # Anlage 4
│       ├── sammelbestaetigung.ts # Anlage 14
│       └── vereinfachter-nachweis.ts
│   └── pdf-templates/
│       ├── briefbogen.ts        # DRK-Briefbogen-Layout (Logo, Sidebar, Falzmarken)
│       ├── pdf-helper.ts        # Shared PDF-Hilfsfunktionen
│       ├── geldzuwendung.ts     # Anlage 3 (PDF)
│       ├── sachzuwendung.ts     # Anlage 4 (PDF)
│       ├── sammelbestaetigung.ts # Anlage 14 (PDF)
│       ├── vereinfachter-nachweis.ts  # Vereinfacht (PDF)
│       └── empfangsbestaetigung.ts    # Sachspenden-Protokoll (PDF)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔒 Datenschutz & Sicherheit

- **Keine Datenbank** — Alle Daten im localStorage des Browsers
- **Keine Cookies** — Keine Tracking-Cookies, keine technischen Cookies
- **Keine externen Dienste** — Keine Analytics, keine CDNs, keine externen Fonts
- **DOCX clientseitig** — Dokumente werden im Browser generiert, kein Server-Upload
- **Open Source** — Vollständig einsehbarer Quellcode

## 🤝 Beitragen

1. Fork erstellen
2. Feature-Branch anlegen (`git checkout -b feature/mein-feature`)
3. Änderungen committen (`git commit -m 'feat: mein Feature'`)
4. Push (`git push origin feature/mein-feature`)
5. Pull Request erstellen

## 📄 Lizenz

MIT — Frei verwendbar für alle DRK-Gliederungen und darüber hinaus.

## 🏥 Über

Ein Projekt des [DRK Kreisverband StädteRegion Aachen e.V.](https://www.drk-aachen.de/)

---

*Gebaut mit ❤️ für das Deutsche Rote Kreuz*
