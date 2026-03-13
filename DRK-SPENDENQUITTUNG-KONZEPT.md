# DRK Spendenquittung – Konzeptdokument

> **App-Name:** DRK Spendenquittung
> **Domain:** `drk-spendenquittung.de`
> **GitHub:** `AFielen/DRK-Spendenquittung`
> **Deployment:** Variante B (Docker/Standalone auf Hetzner, aber OHNE Datenbank — Zero-Data bleibt im Browser)
> **Stand:** März 2026 · DRK Kreisverband StädteRegion Aachen e.V.

---

## 1. Problem & Zielgruppe

### Das Problem

Jeder DRK-Kreisverband und jeder Ortsverein muss Spendern steuerlich anerkannte Zuwendungsbestätigungen (umgangssprachlich „Spendenquittungen") ausstellen. Das BMF schreibt **verbindliche Muster** vor (BMF-Schreiben vom 07.11.2013, BStBl I S. 1333). Die Praxis sieht so aus:

- Schatzmeister füllen **Word-/PDF-Vorlagen manuell** aus – für jeden Spender einzeln
- **Sammelbestätigungen** am Jahresende erfordern händisches Zusammentragen aller Spenden eines Spenders
- Fehlerquellen: falsche Finanzamtsdaten, veralteter Freistellungsbescheid, Tippfehler bei Beträgen, vergessene Pflicht-Textpassagen
- Bei **Sachzuwendungen** müssen zusätzlich Gegenstandsbeschreibung, Alter, Zustand und Wertermittlung dokumentiert werden
- Haftungsrisiko: Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung ausstellt, haftet persönlich für die entgangene Steuer (§ 10b Abs. 4 EStG)

### Die Zielgruppe

- **Primär:** Schatzmeister/Kassenführer in DRK-Kreisverbänden und Ortsvereinen
- **Sekundär:** Geschäftsführer, Vorstandsmitglieder, ehrenamtliche Verwaltungskräfte
- **Reichweite:** ~400 DRK-Kreisverbände, ~3.000+ Ortsvereine bundesweit

### Die Lösung

Eine **Zero-Data-Web-App**, die:
1. Die BMF-Pflichtmuster korrekt im DOCX-Format generiert
2. Vereinsdaten einmalig erfasst und im localStorage speichert
3. Spenderdaten verwaltet (localStorage) und Einzel- + Sammelbestätigungen erzeugt
4. Alle Pflicht-Textbausteine des BMF automatisch einbindet
5. Batch-Export für Jahresabschluss ermöglicht
6. JSON-Export/Import für Backup und Portabilität bietet

---

## 2. Rechtliche Grundlagen

### Verbindliche BMF-Muster (BMF vom 07.11.2013)

Die Zuwendungsbestätigungen müssen nach **amtlich vorgeschriebenem Vordruck** ausgestellt werden (§ 50 Abs. 1 EStDV). Die Muster sind verbindlich — **Wortwahl und Reihenfolge der Textpassagen sind beizubehalten, Umformulierungen sind unzulässig**.

### Für DRK-Vereine relevante BMF-Muster (Anlagen)

Quelle: BMF-Schreiben vom 07.11.2013 (BStBl I S. 1333), GZ IV C 4 - S 2223/07/0018 :005

DRK-Kreisverbände und Ortsvereine sind **steuerbegünstigte Körperschaften** im Sinne des § 5 Abs. 1 Nr. 9 KStG. Von den 18 Anlagen des BMF-Schreibens sind exakt diese drei relevant:

| BMF-Anlage | Muster | Beschreibung |
|---|--------|-------------|
| **Anlage 3** | Geldzuwendung/Mitgliedsbeitrag | Einzelbestätigung an steuerbegünstigte Einrichtung |
| **Anlage 4** | Sachzuwendung | Einzelbestätigung an steuerbegünstigte Einrichtung |
| **Anlage 14** | Sammelbestätigung Geld/Mitgliedsbeitrag | Jahressammelbestätigung an steuerbegünstigte Einrichtung |

(Nicht relevant: Anlagen 1–2 für jur. Personen des öffentl. Rechts, 5–8 für Parteien/Wählervereinigungen, 9–12 für Stiftungen, 13/15–18 deren Sammelbestätigungen)

---

### Anlage 3 — Exakter Aufbau: Geldzuwendung/Mitgliedsbeitrag

```
Aussteller (Bezeichnung und Anschrift der steuerbegünstigten Einrichtung)

        Bestätigung über Geldzuwendungen/Mitgliedsbeitrag
im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1
Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften,
Personenvereinigungen oder Vermögensmassen

Name und Anschrift des Zuwendenden:

Betrag der Zuwendung  - in Ziffern -         - in Buchstaben -

Tag der Zuwendung:

Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja □  Nein □

□  Wir sind wegen Förderung (Angabe des begünstigten Zwecks / der begünstigten
   Zwecke) ..........................................................................
   nach dem Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuer-
   bescheid des Finanzamtes ..………………………………..
   StNr…………………., vom ………….. für den letzten Veranlagungszeitraum
   ….………….. nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der
   Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der
   Gewerbesteuer befreit.

□  Die Einhaltung der satzungsmäßigen Voraussetzungen nach den §§ 51, 59, 60
   und 61 AO wurde vom Finanzamt..........................,
   StNr. …………….. mit Bescheid vom……….. nach § 60a AO gesondert
   festgestellt. Wir fördern nach unserer Satzung (Angabe des begünstigten
   Zwecks / der begünstigten Zwecke) ………………….. .

Es wird bestätigt, dass die Zuwendung nur zur Förderung (Angabe des begünstigten
Zwecks / der begünstigten Zwecke) verwendet wird.

Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge
steuerlich nicht abziehbar sind:
□  Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag handelt,
   dessen Abzug nach § 10b Abs. 1 des Einkommensteuergesetzes ausgeschlossen ist.

(Ort, Datum und Unterschrift des Zuwendungsempfängers)

Hinweis:
Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung
erstellt oder veranlasst, dass Zuwendungen nicht zu den in der Zuwendungs-
bestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet
für die entgangene Steuer (§ 10b Abs. 4 EStG, § 9 Abs. 3 KStG, § 9 Nr. 5 GewStG).

Diese Bestätigung wird nicht als Nachweis für die steuerliche Berücksichtigung
der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides länger als
5 Jahre bzw. das Datum der Feststellung der Einhaltung der satzungsmäßigen
Voraussetzungen nach § 60a Abs. 1 AO länger als 3 Jahre seit Ausstellung des
Bescheides zurückliegt (§ 63 Abs. 5 AO).
```

**Hinweis DRK:** Beim DRK sind Mitgliedsbeiträge steuerlich abziehbar (kein Freizeitverein). Daher wird die Checkbox „nicht um einen Mitgliedsbeitrag, dessen Abzug ausgeschlossen ist" in der Regel NICHT angekreuzt. Die App sollte diese Zeile trotzdem im Dokument belassen, da das BMF-Muster sie vorschreibt.

---

### Anlage 4 — Exakter Aufbau: Sachzuwendung

```
Aussteller (Bezeichnung und Anschrift der steuerbegünstigten Einrichtung)

        Bestätigung über Sachzuwendungen
im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1
Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften,
Personenvereinigungen oder Vermögensmassen

Name und Anschrift des Zuwendenden:

Wert der Zuwendung  - in Ziffern -         - in Buchstaben -

Tag der Zuwendung:

Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw.

□  Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem
   Betriebsvermögen. Die Zuwendung wurde nach dem Wert der Entnahme
   (ggf. mit dem niedrigeren gemeinen Wert) und nach der Umsatzsteuer,
   die auf die Entnahme entfällt, bewertet.

□  Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem
   Privatvermögen.

□  Der Zuwendende hat trotz Aufforderung keine Angaben zur Herkunft der
   Sachzuwendung gemacht.

□  Geeignete Unterlagen, die zur Wertermittlung gedient haben, z. B.
   Rechnung, Gutachten, liegen vor.

□  Wir sind wegen Förderung [... Freistellungsbescheid-Text wie Anlage 3 ...]

□  Die Einhaltung der satzungsmäßigen Voraussetzungen [... wie Anlage 3 ...]

Es wird bestätigt, dass die Zuwendung nur zur Förderung (Angabe des begünstigten
Zwecks / der begünstigten Zwecke) verwendet wird.

(Ort, Datum und Unterschrift des Zuwendungsempfängers)

[Haftungshinweis + Gültigkeitshinweis identisch zu Anlage 3]
```

---

### Anlage 14 — Exakter Aufbau: Sammelbestätigung

```
Aussteller (Bezeichnung und Anschrift der steuerbegünstigten Einrichtung)

        Sammelbestätigung über Geldzuwendungen/Mitgliedsbeiträge
im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1
Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften,
Personenvereinigungen oder Vermögensmassen

Name und Anschrift des Zuwendenden:

Gesamtbetrag der Zuwendung  - in Ziffern -     - in Buchstaben -

Zeitraum der Sammelbestätigung:

□  Wir sind wegen Förderung [... Freistellungsbescheid-Text wie Anlage 3 ...]

□  Die Einhaltung der satzungsmäßigen Voraussetzungen [... wie Anlage 3 ...]

Es wird bestätigt, dass die Zuwendung nur zur Förderung (Angabe des begünstigten
Zwecks / der begünstigten Zwecke) verwendet wird.

Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge
steuerlich nicht abziehbar sind:
□  Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag handelt,
   dessen Abzug nach § 10b Abs. 1 des Einkommensteuergesetzes ausgeschlossen ist.

Es wird bestätigt, dass über die in der Gesamtsumme enthaltenen Zuwendungen
keine weiteren Bestätigungen, weder formelle Zuwendungsbestätigungen noch
Beitragsquittungen oder Ähnliches ausgestellt wurden und werden.

Ob es sich um den Verzicht auf Erstattung von Aufwendungen handelt, ist der
Anlage zur Sammelbestätigung zu entnehmen.

(Ort, Datum und Unterschrift des Zuwendungsempfängers)

[Haftungshinweis + Gültigkeitshinweis identisch zu Anlage 3]


                    Anlage zur Sammelbestätigung

| Datum der Zuwendung | Art der Zuwendung (Geldzuwendung/Mitgliedsbeitrag) | Verzicht auf die Erstattung von Aufwendungen (ja/nein) | Betrag |
|---|---|---|---|
| ... | ... | ... | ... |
| **Gesamtsumme** | | | **______ €** |
```

**Wichtig:** Auf der Anlage zur Sammelbestätigung darf entweder der Name des Zuwendenden oder ein fortlaufendes alphanumerisches Zeichen zur sicheren Identifikation angebracht werden (BMF Nr. 9).

---

### Regeln für die DOCX-Generierung (BMF-Schreiben Nr. 1–16)

**Nr. 1 — Verbindlichkeit:** Muster sind verbindlich (§ 50 Abs. 1 EStDV). Haftungshinweis und Gültigkeitshinweis STETS übernehmen.

**Nr. 2 — Wortwahl:** Wortwahl und Reihenfolge beibehalten. Umformulierungen unzulässig. Keine Danksagungen/Werbung auf Vorderseite (Rückseite erlaubt). Max. DIN A4.

**Nr. 3 — Gestaltung:** Optische Hervorhebungen (Einrahmungen, Ankreuzkästchen) erlaubt. Name/Adresse als Anschriftenfeld anordnen erlaubt. Fortlaufende alphanumerische Kennzeichnung erlaubt. Briefpapier mit Logo/Emblem/Wasserzeichen erlaubt.

**Nr. 5 — Betrag in Buchstaben:** Zwei Varianten erlaubt:
- Zahlwort: „eintausenddreihundertzweiundzwanzig"
- Ziffernweise: „eins - drei - zwei - zwei" (dann Leerräume vor erster und nach letzter Ziffer mit „X" entwerten)

**Nr. 6 — Sachspenden:** Genaue Angaben (Alter, Zustand, historischer Kaufpreis). Betriebsvermögen: Entnahmewert + USt. Privatvermögen: gemeiner Wert + Wertermittlungsunterlagen.

**Nr. 7 — Verzichtszeile:** „Es handelt sich um den Verzicht auf Erstattung von Aufwendungen Ja □ Nein □" STETS übernehmen, auch bei Sammelbestätigungen.

**Nr. 9 — Sammelbestätigung:** Gesamtbetrag muss in Anlage in Einzelzuwendungen aufgeschlüsselt werden. Name des Zuwendenden oder alphanumerisches Zeichen auf der Anlage.

**Nr. 10 — Maschinelle Erstellung und Unterschrift (R 10b.1 Abs. 4 EStR):**

⚠️ **KRITISCH:** Die Befreiung von der eigenhändigen Unterschrift bei maschineller Erstellung gilt **NICHT** für diese App. R 10b.1 Abs. 4 EStR stellt drei Voraussetzungen auf, die eine clientseitige Zero-Data-App nicht erfüllen kann:
1. Das Verfahren muss dem zuständigen Finanzamt **zuvor offiziell angezeigt** werden
2. Das System muss gegen **unbefugte Eingriffe gesichert** sein (ein frei editierbares DOCX schließt das faktisch aus)
3. Es muss eine **direkte, manipulationssichere Verbindung** zwischen Buchhaltung und Bescheinigungserstellung bestehen

Für **Sach- und Aufwandsspenden** ist die maschinelle Unterschriftsbefreiung **generell nicht zulässig**.

**→ Konsequenz für die App:** Die App generiert das DOCX als **perfekt vorausgefülltes Dokument zum Ausdrucken**. Der Schatzmeister **muss** das Dokument ausdrucken und **händisch unterschreiben**. Die Unterschriftenzeile im DOCX enthält daher bewusst eine Leerzeile für die manuelle Unterschrift. Die App zeigt beim Download den Hinweis: „Bitte drucken Sie die Zuwendungsbestätigung aus und unterschreiben Sie eigenhändig."

**Nr. 11 — Doppel aufbewahren (Archivierungspflicht):** Steuerbegünstigte Körperschaft muss Doppel aufbewahren (§ 50 Abs. 7 EStDV). Elektronische Speicherung des Doppels ist zulässig. **Aufbewahrungsfrist: 10 Jahre** für steuerlich relevante Unterlagen.

⚠️ **KRITISCH für Zero-Data-Architektur:** localStorage ist KEIN Archiv. Löscht der Schatzmeister versehentlich Browserdaten, sind das gesetzlich vorgeschriebene Doppel und die Zuordnung der laufenden Nummern unwiederbringlich weg. Die App muss daher:
1. Im Dashboard **visuell dominant** auf regelmäßige JSON-Backups hinweisen
2. Den Batch-Export (ZIP mit allen Doppeln) als **verpflichtenden Jahresabschluss-Schritt** positionieren
3. Bei jeder generierten Bestätigung sofort ein „Doppel"-DOCX zum Download anbieten (mit „DOPPEL"-Kennzeichnung)
4. Einen **Ampel-Status** im Dashboard anzeigen: „Letztes Backup: [Datum]" — rot wenn > 30 Tage her

### Vereinfachter Nachweis (Kleinspenden ≤ 300 €)

Für Zuwendungen **bis 300 €** (seit 01.01.2021, vorher 200 €) reicht dem Spender der Kontoauszug als Nachweis — **aber nur in Kombination mit einem Beleg des Vereins** (§ 50 Abs. 4 EStDV). Auf diesem Beleg muss stehen:
- Der steuerbegünstigte Zweck der Zuwendung
- Die Freistellungsangaben des Vereins
- Ob es sich um eine Spende oder einen Mitgliedsbeitrag handelt

**→ Konsequenz für die App:** Neben der vollen Zuwendungsbestätigung (Anlage 3) soll die App für Spenden ≤ 300 € optional einen **„Vereinfachten Spendennachweis"** generieren können — ein abgerüstetes DOCX-Dokument, das die BMF-Mindestangaben enthält, aber kürzer ist als die volle Bestätigung. Die App zeigt bei Beträgen ≤ 300 € einen Info-Callout mit der Wahlmöglichkeit:
- „Volle Zuwendungsbestätigung erstellen" (Anlage 3)
- „Vereinfachten Spendennachweis erstellen" (§ 50 Abs. 4 EStDV)

---

## 3. Architektur & Tech-Stack

### Deployment: Variante B Standalone (Docker, aber OHNE Datenbank)

```
next.config.ts → output: 'standalone'
```

**Begründung:** Die App braucht kein Backend und keine Datenbank — alle Daten bleiben im `localStorage` des Browsers, DOCX-Generierung erfolgt clientseitig. Trotzdem wird Variante B (standalone + Docker) gewählt, weil alle DRK-Tools einheitlich als Docker-Container auf dem Hetzner-VPS hinter Caddy betrieben werden. Das vereinfacht das Deployment und die Wartung.

### Tech-Stack (DRK-Goldstandard)

| Technologie | Version | Zweck |
|---|---|---|
| Next.js | 16 | App-Framework (App Router, `output: 'standalone'`) |
| React | 19 | UI-Library |
| TypeScript | strict | Typisierung (keine `any`) |
| Tailwind CSS | 4 | Styling (Layout) + DRK-CSS-Variablen (Farben) |
| docx (npm) | latest | DOCX-Generierung clientseitig |
| file-saver | latest | Download-Trigger im Browser |
| Docker | — | Container-Deployment auf Hetzner VPS |

### Hosting & Infrastruktur

**Hetzner VPS** hinter Caddy (wie alle DRK-Tools):

```
┌────────────────────────────────────────────┐
│  Nutzer-Browser                            │
│  https://drk-spendenquittung.de            │
│  (localStorage: Vereins-/Spenderdaten)     │
└──────────────────┬─────────────────────────┘
                   │ HTTPS
┌──────────────────▼─────────────────────────┐
│  Hetzner VPS                               │
│  ┌───────────────────────────────────────┐ │
│  │  Caddy (Reverse Proxy + Let's Encrypt)│ │
│  │  drk-spendenquittung.de → :3000       │ │
│  └──────────────────┬────────────────────┘ │
│  ┌──────────────────▼────────────────────┐ │
│  │  Next.js Standalone (Docker)          │ │
│  │  Port 3000 (intern)                   │ │
│  │  Kein Backend, keine API-Routes       │ │
│  │  Kein Dateisystem-Zugriff nötig       │ │
│  └───────────────────────────────────────┘ │
│                                            │
│  KEINE Datenbank                           │
│  KEIN Mailjet                              │
└────────────────────────────────────────────┘
```

**Caddyfile (auf dem VPS):**

```caddyfile
drk-spendenquittung.de {
    reverse_proxy localhost:3000
}
```

### Docker-Setup

**Dockerfile:**

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

**Deployment:**

```bash
cd /opt/drk-spendenquittung
git pull
docker compose up -d --build
```

### Kein Backend, keine Datenbank

Trotz Variante B: Die App hat **keine API-Routes**, keine serverseitige Logik, keine Datenbank. Der Next.js-Server liefert lediglich die vorgerenderten Seiten aus. Alle Daten bleiben clientseitig:

- Vereinsdaten: `localStorage` (Key: `drk-sq-verein`)
- Spenderliste: `localStorage` (Key: `drk-sq-spender`)
- Spendenliste: `localStorage` (Key: `drk-sq-spenden`)
- Einstellungen: `localStorage` (Key: `drk-sq-settings`)

---

## 4. Datenmodell (TypeScript)

```typescript
// ===== Vereinsdaten (einmalig pro Verband/Ortsverein) =====
interface Verein {
  id: string;                     // UUID
  name: string;                   // z.B. "DRK Kreisverband StädteRegion Aachen e.V."
  strasse: string;
  plz: string;
  ort: string;
  
  // Steuerliche Daten
  finanzamt: string;              // z.B. "Aachen-Stadt"
  steuernummer: string;           // z.B. "201/5909/1234"
  freistellungsart: 'freistellungsbescheid' | 'feststellungsbescheid';
  freistellungDatum: string;      // ISO-Date des Bescheids
  letzterVeranlagungszeitraum: string; // z.B. "2023" (nur bei Freistellungsbescheid)
  beguenstigteZwecke: string[];   // z.B. ["Förderung des Wohlfahrtswesens", "Förderung der Rettung aus Lebensgefahr"]
  
  // Optional
  vereinsregister?: string;       // z.B. "Amtsgericht Aachen VR 4535"
  unterschriftName?: string;      // Name des Unterzeichners
  unterschriftFunktion?: string;  // z.B. "Vorstandsvorsitzender"
  
  // Anpassung
  logoBase64?: string;            // Vereinslogo als Base64 (für DOCX-Kopf)
  
  erstelltAm: string;
  aktualisiertAm: string;
}

// ===== Spender =====
interface Spender {
  id: string;                     // UUID
  anrede?: 'Herr' | 'Frau' | '';
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;
  
  // Optional für eZB (perspektivisch)
  steuerIdNr?: string;            // Steuer-ID für elektronische Übermittlung
  
  erstelltAm: string;
  aktualisiertAm: string;
}

// ===== Einzelne Zuwendung =====
interface Zuwendung {
  id: string;                     // UUID
  spenderId: string;              // FK → Spender
  
  // Zuwendungsart
  art: 'geld' | 'sach';
  verwendung: 'spende' | 'mitgliedsbeitrag';
  
  // Geldzuwendung
  betrag: number;                 // in Euro, Cent-genau
  datum: string;                  // ISO-Date
  zahlungsart?: 'ueberweisung' | 'bar' | 'lastschrift' | 'paypal' | 'sonstige';
  
  // Sachzuwendung (nur bei art === 'sach')
  sachBezeichnung?: string;       // Genaue Bezeichnung
  sachAlter?: string;             // z.B. "ca. 3 Jahre"
  sachZustand?: string;           // z.B. "gut erhalten"
  sachKaufpreis?: number;         // Historischer Kaufpreis
  sachWert?: number;              // Angesetzter Wert
  sachHerkunft?: 'privatvermoegen' | 'betriebsvermoegen' | 'keine_angabe';
  sachWertermittlung?: string;    // z.B. "Gutachten", "Historischer Kaufpreis abzgl. AfA"
  sachEntnahmewert?: number;      // Nur bei Betriebsvermögen
  sachUmsatzsteuer?: number;      // Nur bei Betriebsvermögen
  sachUnterlagenVorhanden: boolean; // PFLICHT bei Sachspenden: Unterlagen zur Wertermittlung
  
  // Verwaltung
  verzicht: boolean;              // Verzicht auf Erstattung von Aufwendungen?
  
  // Status
  bestaetigungErstellt: boolean;
  bestaetigungDatum?: string;     // Wann wurde die Bestätigung generiert
  bestaetigungTyp?: 'anlage3' | 'anlage4' | 'anlage14' | 'vereinfacht'; // Welches Dokument
  laufendeNr?: string;            // Fortlaufende Nummer der Bestätigung
  
  erstelltAm: string;
  aktualisiertAm: string;
}

// ===== Einstellungen =====
interface AppSettings {
  laufendeNrFormat: string;       // z.B. "SQ-{JAHR}-{NR}" → "SQ-2026-001"
  laufendeNrAktuell: number;      // Nächste zu vergebende Nummer
  laufendeNrJahr: number;         // Zum Erkennen des Jahreswechsels
  sammelbestaetigungJahr: number;  // Standardjahr für Sammelbestätigungen
  showKleinspenden: boolean;      // Hinweis auf vereinfachten Nachweis (≤300€)
  letztesBackup?: string;         // ISO-Date des letzten JSON-Exports (für Ampel-Status)
  letzterBatchExport?: string;    // ISO-Date des letzten Jahresabschluss-ZIP-Exports
}
```

---

## 5. Features & Seiten

### 5.1 Startseite (`/`)

**Einstiegsbildschirm mit Wizard-Logik:**

1. **Erststart (kein Verein konfiguriert):** Willkommenstext + „Jetzt einrichten"-Button → Vereins-Setup-Wizard
2. **Verein konfiguriert, aber keine Spender:** „Spender anlegen"-CTA
3. **Regulärer Betrieb:** Dashboard mit Schnellzugriff auf:
   - „Neue Zuwendung erfassen"
   - „Einzelbestätigung erstellen"
   - „Sammelbestätigung erstellen"
   - „Batch-Export (Jahresabschluss)"
   - Statistik-Karten: Anzahl Spender, Summe Zuwendungen aktuelles Jahr, offene Bestätigungen

**Prominente Status-Anzeigen im Dashboard:**

⚠️ **Freistellungsbescheid-Status** (IMMER sichtbar):
- 🟢 Gültig bis [Datum] — „Ihr Freistellungsbescheid ist aktuell."
- 🟡 Läuft in < 6 Monaten ab — „Ihr Bescheid läuft am [Datum] ab. Bitte Verlängerung beantragen."
- 🔴 Abgelaufen — „Bescheid abgelaufen! Keine Zuwendungsbestätigungen ausstellbar. → Einrichtung aktualisieren"

⚠️ **Backup-Status** (IMMER sichtbar, visuell dominant):
- 🟢 Letztes Backup vor < 30 Tagen — „Letztes Backup: [Datum]"
- 🟡 Letztes Backup vor 30–90 Tagen — „Backup überfällig! Ihre Daten existieren nur in diesem Browser."
- 🔴 Kein Backup oder > 90 Tage — „ACHTUNG: Kein aktuelles Backup! Bei Verlust der Browserdaten gehen alle Daten und Doppel verloren. → Jetzt sichern"

### 5.2 Vereins-Setup (`/einrichtung`)

**Wizard, 3 Schritte:**

**Schritt 1 – Stammdaten:**
- Vereinsname, Straße, PLZ, Ort
- Vereinsregister (optional)
- Logo-Upload (optional, als Base64 gespeichert)

**Schritt 2 – Steuerliche Angaben:**
- Finanzamt (Freitextfeld mit Autocomplete für deutsche Finanzämter)
- Steuernummer
- Freistellungsart: Radio-Auswahl
  - ○ Freistellungsbescheid / Anlage zum KSt-Bescheid
  - ○ Feststellungsbescheid nach § 60a AO
- Datum des Bescheids
- Letzter Veranlagungszeitraum (nur bei Freistellungsbescheid)
- Begünstigte Zwecke (Multi-Select aus DRK-typischen Zwecken + Freitext):
  - ☑ Förderung des Wohlfahrtswesens
  - ☑ Förderung der Rettung aus Lebensgefahr
  - ☑ Förderung des Katastrophenschutzes
  - ☑ Förderung der Jugend- und Altenhilfe
  - ☑ Förderung des bürgerschaftlichen Engagements
  - ☐ Sonstige: ___

**Schritt 3 – Unterschrift:**
- Name des Unterzeichners
- Funktion (z.B. „Vorstandsvorsitzender", „Schatzmeister")

**Validierung mit HARTEN BLOCKERN:**
- Wenn Freistellungsbescheid > 5 Jahre alt → ❌ **HARTER BLOCKER** (§ 63 Abs. 5 AO): Keine Bestätigung generierbar! Der Verein darf bei abgelaufenen Bescheiden keine Zuwendungsbestätigungen ausstellen. Tut er es doch, sind die Bestätigungen unrichtig → Vorstandshaftung nach § 10b Abs. 4 EStG.
- Wenn Feststellungsbescheid > 3 Jahre alt → ❌ **HARTER BLOCKER** (§ 63 Abs. 5 AO): Identische Konsequenz.
- Klarer Hinweis: „Die Bescheiddaten Ihres Finanzamts sind abgelaufen. Bitte aktualisieren Sie die Angaben unter Einrichtung, bevor Sie Zuwendungsbestätigungen erstellen."
- Wenn < 6 Monate bis Ablauf → ⚠️ **WARNUNG**: „Ihr Freistellungsbescheid läuft in [X] Monaten ab. Bitte kümmern Sie sich rechtzeitig um die Verlängerung."

### 5.3 Spenderverwaltung (`/spender`)

**Tabelle aller Spender** mit:
- Suche/Filter
- Sortierung nach Name, Ort, letzte Spende
- Pro Zeile: Name, Adresse, Anzahl Zuwendungen, Summe aktuelles Jahr
- Aktionen: Bearbeiten, Löschen (mit Bestätigung), Zuwendungen anzeigen

**Spender anlegen/bearbeiten (Modal oder Unterseite):**
- Anrede (optional), Vorname, Nachname, Straße, PLZ, Ort
- Steuer-ID (optional, für perspektivische eZB)

**Import-Funktion:**
- CSV-Import (Spalten: Vorname, Nachname, Straße, PLZ, Ort)
- Duplikat-Erkennung (Name + PLZ)

### 5.4 Zuwendungen erfassen (`/zuwendungen`)

**Zuwendungsliste** mit:
- Filter nach Spender, Jahr, Art (Geld/Sach), Status (bestätigt/offen)
- Sortierung nach Datum, Betrag
- Summen-Zeile am Ende

**Zuwendung erfassen (Modal):**

**Geldspende:**
- Spender auswählen (Dropdown mit Suche)
- Betrag (€)
- Datum
- Verwendung: ○ Spende ○ Mitgliedsbeitrag
- Zahlungsart (optional)
- ☐ Es handelt sich um den Verzicht auf Erstattung von Aufwendungen
  → Bei Auswahl „Ja" zeigt die App einen **Info-Callout**:
  „⚠️ Ein Aufwandsverzicht ist nur steuerlich abziehbar, wenn der Anspruch auf Erstattung vor der Tätigkeit rechtswirksam eingeräumt wurde (z.B. durch Satzung, Vorstandsbeschluss oder Vertrag) und der Verzicht zeitnah erfolgt. Bitte stellen Sie sicher, dass die entsprechenden Grundlagen dokumentiert vorliegen."

**Sachspende:**
- Spender auswählen
- Bezeichnung des Gegenstands
- Alter, Zustand, historischer Kaufpreis
- Angesetzter Wert (€)
- Datum
- Herkunft: ○ Privatvermögen ○ Betriebsvermögen ○ Keine Angabe des Zuwendenden
- Bei Betriebsvermögen: Entnahmewert + USt
- ☐ Geeignete Unterlagen zur Wertermittlung liegen vor (Pflicht-Checkbox, muss angehakt sein bevor Bestätigung generiert werden kann)
- Unterlagen zur Wertermittlung (Freitext: z.B. „Rechnung vom ...", „Gutachten", „Zeitwertberechnung")

⚠️ **Pflicht-Hinweis bei Sachspenden (immer sichtbar):**
„Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten, Zeitwertberechnung) müssen dem Doppel der Zuwendungsbestätigung in Ihrer Vereinsakte zwingend beigefügt werden. Der Zuwendungsempfänger hat diese Unterlagen zusammen mit der Zuwendungsbestätigung in seine Buchführung aufzunehmen (BMF Nr. 6)."

**Hinweis bei ≤ 300 €:**
Info-Box mit Auswahl:
- „Volle Zuwendungsbestätigung erstellen" (Anlage 3)
- „Vereinfachten Spendennachweis erstellen" (§ 50 Abs. 4 EStDV)
- Erklärtext: „Für Zuwendungen bis 300 € kann der Spender den Spendenabzug auch mit einem Kontoauszug in Kombination mit einem vereinfachten Nachweis Ihres Vereins belegen."

### 5.5 Bestätigung erstellen (`/bestaetigung`)

**Vorab-Prüfung (bei jedem Seitenaufruf):**
- ❌ Freistellungsbescheid abgelaufen? → **HARTER BLOCKER.** Seite zeigt nur Fehlermeldung mit Link zu `/einrichtung`. Kein Download möglich.
- ⚠️ Freistellungsbescheid läuft in < 6 Monaten ab? → Gelbe Warnung oben auf der Seite.

**Drei Modi:**

#### Modus 1: Einzelbestätigung (Anlage 3 / Anlage 4)

1. Spender + Zuwendung auswählen
2. Vorschau des generierten Textes (read-only, zeigt exakten BMF-Wortlaut)
3. Button „DOCX herunterladen"
4. **Pflicht-Hinweis im Download-Dialog:** „Bitte drucken Sie die Zuwendungsbestätigung aus und unterschreiben Sie eigenhändig. Ohne Unterschrift ist die Bestätigung steuerlich nicht anerkennungsfähig."
5. Option: „Doppel für Vereinsakte herunterladen" (identisches DOCX mit „DOPPEL"-Kennzeichnung im Kopf)
6. Zuwendung wird als „Bestätigung erstellt" markiert + laufende Nr. vergeben

#### Modus 2: Sammelbestätigung (Anlage 14)

1. Spender auswählen
2. Zeitraum wählen (Standard: 01.01.–31.12. des gewählten Jahres)
3. Alle Geldzuwendungen des Spenders im Zeitraum werden aufgelistet
4. Summe berechnet
5. Vorschau (inkl. Anlage mit Einzelaufstellung)
6. Button „DOCX herunterladen" (mit Unterschrift-Hinweis wie oben)
7. Alle enthaltenen Zuwendungen als „bestätigt" markiert

#### Modus 3: Vereinfachter Spendennachweis (≤ 300 €)

1. Spender + Zuwendung (≤ 300 €) auswählen
2. Generiert abgerüstetes DOCX mit BMF-Mindestangaben: Vereinsname, Freistellungsdaten, begünstigter Zweck, Angabe Spende/Mitgliedsbeitrag
3. Download als Beleg für den Spender

### 5.6 Batch-Export (`/export`)

**Jahresabschluss-Funktion (PFLICHT für gesetzliche Archivierung):**

⚠️ Diese Funktion ist nicht optional — sie ist die einzige Möglichkeit, die gesetzliche Aufbewahrungspflicht (§ 50 Abs. 7 EStDV, 10 Jahre) bei einer Zero-Data-App zu erfüllen.

1. Jahr auswählen
2. Übersicht: X Spender, Y Zuwendungen, Z € Gesamtsumme
3. Optionen:
   - ☑ Sammelbestätigungen für alle Spender mit Geldzuwendungen
   - ☑ Einzelbestätigungen für Sachzuwendungen
   - ☑ Vereinfachte Spendennachweise (≤ 300 €)
   - ☑ Doppel (Kopie für Vereinsakte) mit Kennzeichnung „DOPPEL" — **immer aktiviert, nicht abwählbar**
4. Export als **ZIP-Datei** mit allen DOCX-Dateien
5. Dateiname-Schema: `Zuwendungsbestaetigung_{Jahr}_{Nachname}_{Vorname}.docx`
6. Ordnerstruktur im ZIP:
   - `/Bestaetigungen/` — Originale für Spender
   - `/Doppel/` — Kopien für Vereinsakte (10 Jahre aufbewahren!)
   - `/Vereinfacht/` — Vereinfachte Nachweise (≤ 300 €)
   - `Uebersicht_{Jahr}.csv` — Gesamtliste aller Bestätigungen mit lfd. Nr.
7. **Pflicht-Hinweis nach Export:** „Bitte speichern Sie diese ZIP-Datei an einem sicheren Ort (z.B. Vereins-NAS, USB-Stick). Der Ordner 'Doppel' muss gemäß § 50 Abs. 7 EStDV mindestens 10 Jahre aufbewahrt werden."

### 5.7 Daten-Management (`/daten`)

- **JSON-Export** aller Daten (Verein, Spender, Zuwendungen, Settings)
- **JSON-Import** mit Merge-Logik (nach Timestamps)
- **Daten löschen** (mit doppelter Bestätigung)
- **Statistik:** Zuwendungen pro Jahr, pro Zweck, Spendenverteilung

### 5.8 Pflichtseiten

- `/impressum` — DRK KV Aachen Standard
- `/datenschutz` — Zero-Data-Hinweis, localStorage-Erklärung, keine externen Dienste
- `/hilfe` — FAQ mit `<details>`-Elementen, Erklärung der BMF-Anforderungen
- `/spenden` — DRK-Standard Spendenseite

---

## 6. DOCX-Generierung

### Technologie

Clientseitige Generierung mit dem npm-Paket `docx` (docx-js). Kein Server nötig.

```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
```

### Template-Mapping: BMF-Anlage → DOCX

Die DOCX-Templates bilden die BMF-Anlagen **1:1** ab. Jedes Feld der Anlage wird als docx-Absatz generiert. Die exakten Texte liegen in `lib/docx-templates/shared.ts` als Konstanten.

| DOCX-Template | BMF-Anlage | Besonderheiten |
|---|---|---|
| `geldzuwendung.ts` | Anlage 3 | Zwei Freistellungs-Varianten als Checkboxen, Verzichtszeile, Mitgliedsbeitrag-Hinweis |
| `sachzuwendung.ts` | Anlage 4 | Gegenstandsbeschreibung, 4 Herkunft-Checkboxen (BV/PV/keine Angabe/Unterlagen), KEIN Mitgliedsbeitrag-Hinweis |
| `sammelbestaetigung.ts` | Anlage 14 | Zeitraum statt Tag, Gesamtbetrag, Doppelbestätigungs-Ausschluss-Satz, Verzicht aus Anlage, Seite 2 = Aufstellung |

**Anlage zur Sammelbestätigung (Seite 2):**
Tabelle mit exakt diesen Spalten (BMF-Vorgabe):
- Datum der Zuwendung
- Art der Zuwendung (Geldzuwendung/Mitgliedsbeitrag)
- Verzicht auf die Erstattung von Aufwendungen (ja/nein)
- Betrag
- Gesamtsumme-Zeile am Ende

### Betrag in Buchstaben (BMF Nr. 5)

Zwei Varianten erlaubt:

```typescript
// Variante 1: Zahlwort (Standard)
// 1.322,50 → "eintausenddreihundertzweiundzwanzig Euro und fünfzig Cent"

// Variante 2: Ziffernweise (Alternative, BMF explizit erlaubt)
// 1.322,50 → "X eins - drei - zwei - zwei Euro und fünfzig Cent X"
// Leerräume vor erster und nach letzter Ziffer mit "X" entwerten!

function betragInBuchstaben(betrag: number, modus: 'zahlwort' | 'ziffern' = 'zahlwort'): string {
  // Implementation mit deutschen Zahlwörtern
  // Sonderfälle: 1 Euro = "ein Euro", 1 Cent = "ein Cent", 0 Cent = nur "... Euro"
}
```

**Die App verwendet standardmäßig Zahlwörter** (Variante 1), da dies professioneller wirkt. Variante 2 kann als Option angeboten werden.

### DOCX-Formatierung

- **Schrift:** Arial 10pt (System-Stack im Web, Arial im DOCX)
- **Seitenrand:** 25mm links, 20mm rechts, 20mm oben, 20mm unten
- **Logo:** Optional, oben links, max 2cm × 2cm
- **Überschrift:** Arial 11pt, fett
- **Pflicht-Texte:** Arial 9pt (damit alles auf eine A4-Seite passt)
- **Haftungshinweis:** Arial 8pt
- **Laufende Nr.:** Arial 8pt, rechtsbündig in der Fußzeile

---

## 7. Projektstruktur

```
DRK-Spendenquittung/
├── CLAUDE.md                          # App-spezifische Konventionen
├── INFRASTRUCTURE.md                  # → Verweis auf Template
├── CHANGELOG.md
├── PROJECT.md
├── README.md
├── app/
│   ├── layout.tsx                     # DRK-Header + Footer (Standard)
│   ├── page.tsx                       # Dashboard / Startseite
│   ├── globals.css                    # DRK CSS-Variablen
│   ├── not-found.tsx
│   ├── einrichtung/
│   │   └── page.tsx                   # Vereins-Setup-Wizard
│   ├── spender/
│   │   └── page.tsx                   # Spenderverwaltung
│   ├── zuwendungen/
│   │   └── page.tsx                   # Zuwendungen erfassen
│   ├── bestaetigung/
│   │   └── page.tsx                   # Bestätigung erstellen (Einzel + Sammel)
│   ├── export/
│   │   └── page.tsx                   # Batch-Export
│   ├── daten/
│   │   └── page.tsx                   # JSON Import/Export, Statistik
│   ├── impressum/page.tsx
│   ├── datenschutz/page.tsx
│   ├── hilfe/page.tsx
│   └── spenden/page.tsx
├── components/
│   ├── VereinsSetupWizard.tsx
│   ├── SpenderTabelle.tsx
│   ├── SpenderFormular.tsx
│   ├── ZuwendungFormular.tsx
│   ├── ZuwendungTabelle.tsx
│   ├── BestaetigungVorschau.tsx
│   ├── BatchExport.tsx
│   ├── DatenManager.tsx
│   ├── StatistikKarten.tsx
│   ├── FreistellungsBlocker.tsx        # HARTER BLOCKER bei abgelaufenem Bescheid
│   ├── BackupStatusAnzeige.tsx        # Ampel-Status für Backup im Dashboard
│   ├── UnterschriftHinweis.tsx        # Pflicht-Hinweis "Ausdrucken und unterschreiben"
│   ├── KleinspendenHinweis.tsx        # Auswahl voll/vereinfacht bei ≤300€
│   ├── SachspendenHinweise.tsx        # Wertermittlungs-Pflichthinweis
│   ├── AufwandsverzichtInfo.tsx       # Info-Callout bei Verzicht auf Aufwendungserstattung
│   └── BetragInWorten.tsx             # Betrag → deutsche Zahlwörter
├── lib/
│   ├── types.ts                       # Alle TypeScript-Interfaces
│   ├── i18n.ts                        # DE/EN Übersetzungen
│   ├── version.ts                     # App-Version
│   ├── storage.ts                     # localStorage-Abstraction (CRUD)
│   ├── docx-templates/
│   │   ├── geldzuwendung.ts           # DOCX-Template Anlage 3 (Einzelbestätigung Geld)
│   │   ├── sachzuwendung.ts           # DOCX-Template Anlage 4 (Sachzuwendung)
│   │   ├── sammelbestaetigung.ts      # DOCX-Template Anlage 14 (Sammelbestätigung)
│   │   ├── vereinfachter-nachweis.ts  # DOCX-Template vereinfachter Spendennachweis (≤300€)
│   │   ├── shared.ts                  # Gemeinsame Textbausteine (BMF-Wortlaut, EXAKT)
│   │   └── betrag-in-worten.ts        # Betrag → Buchstaben Konverter
│   ├── freistellung-check.ts         # Prüflogik: Bescheid abgelaufen? → Blocker/Warnung
│   ├── export.ts                      # JSON Export/Import Logik
│   ├── batch.ts                       # Batch-/ZIP-Export Logik
│   ├── csv-import.ts                  # CSV → Spender Parser
│   └── validation.ts                  # Formular-Validierungen
├── public/
│   ├── logo.png                       # DRK-Logo (42×42)
│   ├── logo.svg
│   └── favicon.svg
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── tailwind.config.ts
├── next.config.ts                     # output: 'standalone'
├── Dockerfile                         # Multi-stage build → node:22-alpine
└── docker-compose.yml                 # Port 3000, restart: unless-stopped
```

---

## 8. Claude-Code-Roadmap

### Phase 1: Grundgerüst (Tag 1–2)

**Prompt 1.1 – Projekt-Setup:**

```
Erstelle eine neue Next.js 16 App aus dem DRK-App-Template (https://github.com/AFielen/drk-app-template.git).
App-Name: "DRK Spendenquittung", Untertitel: "Zuwendungsbestätigungen für DRK-Verbände"
Deployment: Variante B Standalone (output: 'standalone'), Docker.
Erstelle Dockerfile (multi-stage: deps → builder → runner mit node:22-alpine) und docker-compose.yml (Port 3000).
Erstelle die Grundstruktur mit allen Routen laut Projektstruktur.
Installiere zusätzlich: docx, file-saver, jszip.
@types/file-saver als devDependency.
Erstelle lib/types.ts mit allen Interfaces aus dem Konzept.
Erstelle lib/storage.ts als localStorage-Abstraktion mit generischen CRUD-Funktionen.
Erstelle lib/version.ts mit APP_VERSION = "0.1.0".
Header, Footer, globals.css exakt nach Template-Vorgabe.
Pflichtseiten (Impressum, Datenschutz, Hilfe, Spenden) mit Platzhalter-Inhalten.

Ergebnis: npm run build erfolgreich, alle Routen erreichbar, DRK-Design sichtbar.
Test: npm run build && tsc --noEmit
```

**Prompt 1.2 – Vereins-Setup:**

```
Implementiere /einrichtung als 3-Schritt-Wizard (VereinsSetupWizard.tsx).
Schritt 1: Stammdaten (Name, Adresse, Vereinsregister, Logo-Upload als Base64).
Schritt 2: Steuerliche Angaben (Finanzamt, StNr, Freistellungsart als Radio, Datum, Veranlagungszeitraum, begünstigte Zwecke als Multi-Select mit DRK-typischen Optionen + Freitext).
Schritt 3: Unterschrift (Name, Funktion).
Speicherung in localStorage unter 'drk-sq-verein'.

Validierung (HARTE BLOCKER, nicht nur Warnungen!):
- Wenn Freistellungsbescheid-Datum > 5 Jahre her: 🔴 Roter Hinweis "Bescheid abgelaufen!
  Mit diesen Daten können keine Zuwendungsbestätigungen erstellt werden."
  Wizard lässt Speichern trotzdem zu (damit Daten nicht verloren gehen),
  aber /bestaetigung und /export blockieren den Download.
- Wenn Feststellungsbescheid-Datum > 3 Jahre her: identisch.
- Wenn < 6 Monate bis Ablauf: 🟡 Gelbe Warnung "Bescheid läuft bald ab."
- Pflichtfelder: Vereinsname, Adresse, Finanzamt, StNr, Bescheiddatum, mind. 1 begünstigter Zweck.

Weiterleitung zur Startseite nach Abschluss.
Startseite erkennt ob Verein konfiguriert ist und zeigt entsprechend CTA oder Dashboard.

Ergebnis: Wizard funktional, Daten persistiert, Blocker bei abgelaufenen Bescheiden.
Test: npm run build && tsc --noEmit
```

### Phase 2: Spender & Zuwendungen (Tag 3–4)

**Prompt 2.1 – Spenderverwaltung:**

```
Implementiere /spender mit SpenderTabelle.tsx und SpenderFormular.tsx.
Tabelle: Sortierbar nach Name/Ort, Suchfeld, Anzahl Zuwendungen + Jahressumme pro Zeile.
Formular: Modal zum Anlegen/Bearbeiten (Anrede, Vorname, Nachname, Straße, PLZ, Ort).
Löschen mit Bestätigungs-Dialog (warnt wenn Zuwendungen vorhanden).
CSV-Import-Button: Parst CSV mit Spalten Vorname;Nachname;Straße;PLZ;Ort.
Duplikat-Erkennung bei Import (Name + PLZ).
localStorage: 'drk-sq-spender' als Array.

Ergebnis: CRUD für Spender funktional, CSV-Import getestet.
Test: npm run build && tsc --noEmit
```

**Prompt 2.2 – Zuwendungen erfassen:**

```
Implementiere /zuwendungen mit ZuwendungTabelle.tsx und ZuwendungFormular.tsx.
Tabelle: Filter nach Spender/Jahr/Art/Status, Sortierung nach Datum/Betrag, Summenzeile.
Formular als Modal:
- Spender-Auswahl (Dropdown mit Suche)
- Toggle Geld/Sach
- Geldspende: Betrag, Datum, Verwendung (Spende/Mitgliedsbeitrag), Zahlungsart, Verzicht-Checkbox
- Sachspende: Alle Sachzuwendungs-Felder laut Datenmodell, inkl. Herkunft-Auswahl
  (Privatvermögen / Betriebsvermögen / Keine Angabe), Pflicht-Checkbox "Unterlagen liegen vor"

AufwandsverzichtInfo.tsx:
- Zeigt sich wenn Verzicht-Checkbox angehakt wird
- Info-Callout: "Ein Aufwandsverzicht ist nur steuerlich abziehbar, wenn der Anspruch auf
  Erstattung VOR der Tätigkeit rechtswirksam eingeräumt wurde (z.B. durch Satzung,
  Vorstandsbeschluss oder Vertrag) und der Verzicht zeitnah erfolgt."

SachspendenHinweise.tsx:
- Zeigt sich bei Sachspende, IMMER sichtbar (nicht wegklickbar)
- Text: "Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten, Zeitwertberechnung)
  müssen dem Doppel der Zuwendungsbestätigung in Ihrer Vereinsakte zwingend beigefügt werden."
- Checkbox "Unterlagen liegen vor" muss angehakt sein, bevor die Zuwendung gespeichert werden kann

KleinspendenHinweis.tsx: Bei Betrag ≤ 300€ Auswahl anbieten:
- "Volle Zuwendungsbestätigung erstellen" (Anlage 3)
- "Vereinfachten Spendennachweis erstellen" (§ 50 Abs. 4 EStDV)

localStorage: 'drk-sq-spenden' als Array.

Ergebnis: Zuwendungen erfassbar, alle steuerrechtlichen Hinweise integriert.
Test: npm run build && tsc --noEmit
```

### Phase 3: DOCX-Generierung (Tag 5–7)

**Prompt 3.1 – Shared Templates & Betrag-Konverter:**

```
Erstelle lib/docx-templates/shared.ts mit allen BMF-Pflicht-Textbausteinen als Konstanten.
Quelle: BMF-Schreiben vom 07.11.2013, Anlagen 3, 4 und 14.
EXAKTER WORTLAUT — keine Umformulierungen (BMF Nr. 2):

Konstanten:
- TITEL_GELDZUWENDUNG: "Bestätigung über Geldzuwendungen/Mitgliedsbeitrag\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen"
- TITEL_SACHZUWENDUNG: analog mit "Sachzuwendungen"
- TITEL_SAMMELBESTAETIGUNG: analog mit "Sammelbestätigung über Geldzuwendungen/Mitgliedsbeiträge"
- FREISTELLUNG_VARIANTE_A(finanzamt, stNr, datum, veranlagungszeitraum, zwecke): exakter Text mit "Wir sind wegen Förderung..."
- FREISTELLUNG_VARIANTE_B(finanzamt, stNr, datum, zwecke): exakter Text mit "Die Einhaltung der satzungsmäßigen Voraussetzungen..."
- VERWENDUNGSBESTAETIGUNG(zwecke): "Es wird bestätigt, dass die Zuwendung nur zur Förderung ... verwendet wird."
- MITGLIEDSBEITRAG_HINWEIS: "Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag handelt, dessen Abzug nach § 10b Abs. 1 des Einkommensteuergesetzes ausgeschlossen ist."
- SAMMEL_DOPPELBESTAETIGUNG: "Es wird bestätigt, dass über die in der Gesamtsumme enthaltenen Zuwendungen keine weiteren Bestätigungen, weder formelle Zuwendungsbestätigungen noch Beitragsquittungen oder Ähnliches ausgestellt wurden und werden."
- SAMMEL_VERZICHTHINWEIS: "Ob es sich um den Verzicht auf Erstattung von Aufwendungen handelt, ist der Anlage zur Sammelbestätigung zu entnehmen."
- HAFTUNGSHINWEIS: exakter Text mit "Wer vorsätzlich oder grob fahrlässig..."
- GUELTIGKEITSHINWEIS: exakter Text mit "Diese Bestätigung wird nicht als Nachweis..."
- SACHSPENDE_BETRIEBSVERMOEGEN: "Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem Betriebsvermögen. Die Zuwendung wurde nach dem Wert der Entnahme (ggf. mit dem niedrigeren gemeinen Wert) und nach der Umsatzsteuer, die auf die Entnahme entfällt, bewertet."
- SACHSPENDE_PRIVATVERMOEGEN: "Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem Privatvermögen."
- SACHSPENDE_KEINE_ANGABE: "Der Zuwendende hat trotz Aufforderung keine Angaben zur Herkunft der Sachzuwendung gemacht."
- SACHSPENDE_UNTERLAGEN: "Geeignete Unterlagen, die zur Wertermittlung gedient haben, z. B. Rechnung, Gutachten, liegen vor."

Erstelle lib/docx-templates/betrag-in-worten.ts:
Funktion betragInWorten(betrag: number): string
- Wandelt z.B. 1322.50 in "eintausenddreihundertzweiundzwanzig Euro und fünfzig Cent"
- Korrekte deutsche Zahlwörter bis 999.999.999,99€
- Cent als "... und XX Cent" (bei 0 Cent: nur "... Euro")
- Sonderfall: 1 Euro = "ein Euro", 1 Cent = "ein Cent"
- BMF Nr. 5 beachten: Zahlwort-Variante ist Standard

Ergebnis: Alle Texte als typisierte Konstanten, Betrag-Konverter mit Testfällen.
Test: npm run build && tsc --noEmit
```

**Prompt 3.2 – DOCX Geldzuwendung (Anlage 3):**

```
Erstelle lib/docx-templates/geldzuwendung.ts.
Nutze das npm-Paket 'docx' für clientseitige DOCX-Generierung.
Funktion: generateGeldzuwendung(verein: Verein, spender: Spender, zuwendung: Zuwendung): Promise<Blob>

Exakter Aufbau gemäß BMF-Anlage 3 (Reihenfolge einhalten!):
1. Optional: Logo des Vereins oben links (aus verein.logoBase64, max 2cm×2cm)
2. Aussteller: Vereinsname + Adresse (BMF: "Bezeichnung und Anschrift der steuerbegünstigten Einrichtung")
3. Titel: TITEL_GELDZUWENDUNG aus shared.ts — Arial 11pt fett
4. "Name und Anschrift des Zuwendenden:" + Spenderdaten
5. "Betrag der Zuwendung  - in Ziffern -  [Betrag]  - in Buchstaben -  [betragInWorten]"
6. "Tag der Zuwendung: [Datum]"
7. "Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja □ / Nein □" (als Checkbox)
8. Freistellungsstatus — je nach verein.freistellungsart:
   - Checkbox ☑ vor dem zutreffenden Text (Variante A oder B), mit eingesetzten Vereinsdaten
9. Verwendungsbestätigung: "Es wird bestätigt, dass die Zuwendung nur zur Förderung [Zwecke] verwendet wird."
10. Mitgliedsbeitrag-Hinweis: "Nur für steuerbegünstigte Einrichtungen..." 
    → Bei DRK: Diese Zeile im Dokument lassen, Checkbox aber NICHT ankreuzen (DRK-Beiträge sind abziehbar)
11. Ort/Datum + Unterschriftenzeile (Name + Funktion aus Verein)
12. "Hinweis:" + Haftungshinweis + Gültigkeitshinweis (Arial 8pt)

Formatierung:
- Seite: A4, Ränder 25mm links, 20mm rechts/oben/unten
- Schrift: Arial 10pt Standard, 11pt Titel, 8pt Hinweise
- Laufende Nr. in Fußzeile (Arial 8pt, rechtsbündig)
- Checkboxen als ☐ / ☑ Unicode-Zeichen

Alle Pflicht-Texte aus shared.ts verwenden. Keine Umformulierungen!

Ergebnis: DOCX-Datei entspricht BMF-Anlage 3, öffnet korrekt in Word/LibreOffice.
Test: npm run build && tsc --noEmit + manueller Test mit Testdaten
```

**Prompt 3.3 – DOCX Sachzuwendung (Anlage 4) + Sammelbestätigung (Anlage 14):**

```
Erstelle lib/docx-templates/sachzuwendung.ts gemäß BMF-Anlage 4:
- Titel: TITEL_SACHZUWENDUNG
- Statt "Betrag": "Wert der Zuwendung" 
- Nach "Tag der Zuwendung": Freitext-Block "Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw."
- 4 Checkboxen für Herkunft/Wertermittlung:
  ☐ Betriebsvermögen (SACHSPENDE_BETRIEBSVERMOEGEN)
  ☐ Privatvermögen (SACHSPENDE_PRIVATVERMOEGEN)
  ☐ Keine Angabe (SACHSPENDE_KEINE_ANGABE)
  ☐ Unterlagen liegen vor (SACHSPENDE_UNTERLAGEN)
- Dann Freistellungsstatus (wie Anlage 3)
- Verwendungsbestätigung
- KEIN Mitgliedsbeitrag-Hinweis (bei Sachspenden nicht vorgesehen)
- Haftungs-/Gültigkeitshinweis

Erstelle lib/docx-templates/sammelbestaetigung.ts gemäß BMF-Anlage 14:
- Titel: TITEL_SAMMELBESTAETIGUNG
- "Gesamtbetrag der Zuwendung" statt "Betrag"
- "Zeitraum der Sammelbestätigung:" statt "Tag der Zuwendung"
- Freistellungsstatus + Verwendungsbestätigung + Mitgliedsbeitrag-Hinweis
- PFLICHT-Zusatz: SAMMEL_DOPPELBESTAETIGUNG ("Es wird bestätigt, dass über die in der Gesamtsumme enthaltenen Zuwendungen keine weiteren Bestätigungen...")
- PFLICHT-Zusatz: SAMMEL_VERZICHTHINWEIS ("Ob es sich um den Verzicht... ist der Anlage zu entnehmen")
- Seite 2: "Anlage zur Sammelbestätigung" als Tabelle mit exakt diesen Spalten:
  | Datum der Zuwendung | Art der Zuwendung (Geldzuwendung/Mitgliedsbeitrag) | Verzicht auf Erstattung (ja/nein) | Betrag |
  + Gesamtsumme-Zeile am Ende
- BMF Nr. 9: Name des Zuwendenden oder fortlaufendes Zeichen auf der Anlage

Ergebnis: Beide Templates generieren BMF-konforme DOCX-Dateien.
Test: npm run build && tsc --noEmit + manueller Test
```

### Phase 4: Bestätigungsworkflow & Export (Tag 8–10)

**Prompt 4.1 – Bestätigungsseite:**

```
Implementiere /bestaetigung mit drei Tabs: "Einzelbestätigung", "Sammelbestätigung", "Vereinfachter Nachweis (≤300€)".

VORAB-PRÜFUNG (bei jedem Seitenaufruf):
Erstelle lib/freistellung-check.ts:
- Funktion prüfFreistellung(verein: Verein): 'gueltig' | 'warnung' | 'abgelaufen'
- Bei Freistellungsbescheid: abgelaufen wenn > 5 Jahre seit verein.freistellungDatum
- Bei Feststellungsbescheid: abgelaufen wenn > 3 Jahre seit verein.freistellungDatum
- Warnung wenn < 6 Monate bis Ablauf
FreistellungsBlocker.tsx:
- Wenn 'abgelaufen': Rote Vollbild-Meldung, KEIN Download möglich.
  Text: "Die Bescheiddaten Ihres Finanzamts sind abgelaufen. [...] → Einrichtung aktualisieren"
- Wenn 'warnung': Gelber Banner oben auf der Seite
- Wenn 'gueltig': Nichts anzeigen

Einzelbestätigung (Anlage 3 für Geld, Anlage 4 für Sach):
1. Spender-Auswahl → zeigt offene Zuwendungen des Spenders
2. Zuwendung auswählen
3. BestaetigungVorschau.tsx: Read-only Vorschau des generierten BMF-Textes
4. "DOCX herunterladen"-Button:
   - UnterschriftHinweis.tsx als Modal VOR dem Download:
     "Bitte drucken Sie die Zuwendungsbestätigung aus und unterschreiben Sie eigenhändig.
      Ohne Unterschrift ist die Bestätigung steuerlich nicht anerkennungsfähig."
   - Checkbox: "Doppel für Vereinsakte miterzeugen" (erzeugt zweites DOCX mit "DOPPEL" im Kopf)
5. Zuwendung als bestätigt markiert + laufende Nr. vergeben

Sammelbestätigung (Anlage 14):
1. Spender-Auswahl
2. Jahr/Zeitraum-Wahl
3. Liste aller Geldzuwendungen im Zeitraum + Gesamtsumme
4. Vorschau (inkl. Seite 2: Anlage mit 4-Spalten-Tabelle gemäß BMF)
5. Download mit Unterschrift-Hinweis + Doppel-Option
6. Alle enthaltenen Zuwendungen als bestätigt markiert

Vereinfachter Nachweis (≤ 300 €):
1. Spender + Zuwendung (nur ≤ 300 €) auswählen
2. Erstelle lib/docx-templates/vereinfachter-nachweis.ts:
   Abgerüstetes DOCX mit: Vereinsname, Freistellungsdaten, begünstigter Zweck,
   Angabe ob Spende/Mitgliedsbeitrag. Kein Haftungshinweis nötig.
3. Download

Laufende Nummern automatisch vergeben nach Format aus Settings.

Ergebnis: Vollständiger Bestätigungs-Workflow mit harter Freistellungsprüfung.
Test: npm run build && tsc --noEmit
```

**Prompt 4.2 – Batch-Export:**

```
Implementiere /export (BatchExport.tsx).
VORAB: FreistellungsBlocker.tsx-Prüfung (wie bei /bestaetigung).

1. Jahresauswahl
2. Übersicht: Anzahl Spender, Zuwendungen, Gesamtsumme
3. Optionen mit Checkboxen:
   - ☑ Sammelbestätigungen für alle Spender mit Geldzuwendungen
   - ☑ Einzelbestätigungen für Sachzuwendungen
   - ☑ Vereinfachte Nachweise für Zuwendungen ≤ 300 €
   - ☑ Doppel für Vereinsakte — IMMER AKTIVIERT, NICHT ABWÄHLBAR
     (Hinweis: "Pflicht gemäß § 50 Abs. 7 EStDV — 10 Jahre Aufbewahrung")
4. "ZIP exportieren"-Button:
   - Nutzt JSZip für clientseitige ZIP-Erstellung
   - Ordnerstruktur:
     /Bestaetigungen/ — Originale für Spender
     /Doppel/ — Kopien für Vereinsakte (mit "DOPPEL"-Kennzeichnung)
     /Vereinfacht/ — Vereinfachte Nachweise (≤ 300 €)
     Uebersicht_{Jahr}.csv — Gesamtliste mit lfd. Nr., Spender, Betrag, Datum, Art
   - Dateinamen: Zuwendungsbestaetigung_{Jahr}_{Nachname}_{Vorname}.docx
5. Fortschrittsbalken während Generierung
6. PFLICHT-HINWEIS nach Download (nicht wegklickbar, 5 Sek.):
   "Bitte speichern Sie diese ZIP-Datei an einem sicheren Ort. Der Ordner 'Doppel'
    muss gemäß § 50 Abs. 7 EStDV mindestens 10 Jahre aufbewahrt werden."
7. settings.letzterBatchExport auf aktuelles Datum setzen

Ergebnis: ZIP-Download mit allen Bestätigungen + Doppel + Übersicht.
Test: npm run build && tsc --noEmit
```

**Prompt 4.3 – Daten-Management:**

```
Implementiere /daten (DatenManager.tsx).
- JSON-Export: Alle localStorage-Keys als ein JSON-Objekt, Download als drk-spendenquittung-backup-{datum}.json
  → Bei jedem Export: settings.letztesBackup auf aktuelles Datum setzen
- JSON-Import: Upload-Button, Merge-Logik (neuere Timestamps gewinnen), Duplikat-Erkennung per ID
- "Alle Daten löschen"-Button: Doppelte Bestätigung ("Sind Sie sicher?" → Eingabe von "LÖSCHEN" bestätigen)
  → VOR dem Löschen: Prüfe ob Backup in den letzten 24h erstellt wurde. Falls nein: "Sie haben kein aktuelles Backup. Bitte erstellen Sie zuerst einen Export."
- StatistikKarten.tsx: Zuwendungen pro Jahr (Balkendiagramm als CSS), Verteilung nach Zweck, Top-Spender

BackupStatusAnzeige.tsx (wird im Dashboard + hier angezeigt):
- Liest settings.letztesBackup und settings.letzterBatchExport
- Ampel-Logik:
  🟢 < 30 Tage → "Letztes Backup: [Datum]"
  🟡 30–90 Tage → "Backup überfällig! Ihre Daten existieren nur in diesem Browser."
  🔴 > 90 Tage oder nie → "ACHTUNG: Kein aktuelles Backup! → Jetzt sichern" + roter Rahmen

Ergebnis: Vollständiges Datenmanagement mit Backup-Tracking und Ampel-Status.
Test: npm run build && tsc --noEmit
```

### Phase 5: Polish & Pflichtseiten (Tag 11–12)

**Prompt 5.1 – Pflichtseiten + i18n:**

```
Implementiere die Pflichtseiten:
- /impressum: DRK KV Aachen Standarddaten
- /datenschutz: Zero-Data, nur localStorage, keine externen Dienste, keine Cookies, Betroffenenrechte
- /hilfe: FAQ mit <details>-Elementen:
  - "Was ist eine Zuwendungsbestätigung?"
  - "Welche BMF-Muster werden verwendet?"
  - "Muss ich die Bestätigung unterschreiben?" → JA, eigenhändig. Erklärung warum.
  - "Wie lange ist mein Freistellungsbescheid gültig?" → 5 Jahre / 3 Jahre, was passiert bei Ablauf
  - "Was muss ich bei Sachspenden beachten?" → Wertermittlung, Unterlagen beim Doppel
  - "Was ist ein Aufwandsverzicht?" → Voraussetzungen (Satzung/Vorstandsbeschluss VOR Tätigkeit)
  - "Wie lange muss ich die Doppel aufbewahren?" → 10 Jahre, § 50 Abs. 7 EStDV
  - "Wo sind meine Daten gespeichert?" → localStorage, Risiko bei Browserdaten-Löschung
  - "Kann ich die Daten auf ein anderes Gerät übertragen?" → JSON-Export/Import
  - "Brauche ich für Spenden unter 300 € eine Bestätigung?" → Nein, aber vereinfachter Nachweis empfohlen
  + Kontaktbox
- /spenden: DRK-Standard

lib/i18n.ts: Alle sichtbaren Texte als DE/EN Keys.
DE/EN-Umschalter im Footer.

Ergebnis: Alle Pflichtseiten komplett, i18n funktional.
Test: npm run build && tsc --noEmit
```

**Prompt 5.2 – Dashboard, Mobile, Final:**

```
Finalisiere die Startseite (page.tsx):
- Drei Zustände: Erststart / Kein Spender / Regulär
- Dashboard mit StatistikKarten: Anzahl Spender, Jahressumme, Offene Bestätigungen
- Schnellzugriff-Buttons zu allen Funktionen
- Exit-Guard (beforeunload) bei ungespeicherten Formular-Daten

PROMINENTE STATUS-ANZEIGEN (IMMER sichtbar im Dashboard):

1. FreistellungsBlocker.tsx im Dashboard einbinden:
   🟢 Gültig → "Freistellungsbescheid gültig bis [Datum]"
   🟡 < 6 Monate → "Bescheid läuft am [Datum] ab — Verlängerung beantragen"
   🔴 Abgelaufen → "BESCHEID ABGELAUFEN — Keine Bestätigungen ausstellbar! → Einrichtung"

2. BackupStatusAnzeige.tsx im Dashboard einbinden:
   🟢/🟡/🔴 Ampel nach letztesBackup-Datum (siehe Prompt 4.3)

3. Jahresabschluss-Erinnerung:
   Ab 1. November: "Jahresabschluss-Export für [Jahr] empfohlen → Batch-Export"
   Ab 1. Februar (Vorjahr noch nicht exportiert): Roter Hinweis

Mobile-Optimierung:
- Tabellen als Card-Layout auf kleinen Screens
- Touch-Targets mindestens 44×44px
- Bottom-Sheet-Stil für Modals auf Mobile

README.md nach DRK-Template-Vorgabe erstellen.
CHANGELOG.md anlegen.

Ergebnis: App vollständig, mobil nutzbar, alle Sicherheitsmechanismen aktiv.
Test: npm run build && tsc --noEmit
```

---

## 9. Nicht im Scope (bewusst ausgeklammert für MVP)

- **Elektronische Zuwendungsbestätigung (eZB)** via § 50 Abs. 2 EStDV — Gesetzlich etabliert seit 2024 (Zuwendungsempfängerregister beim BZSt ist online), erfordert aber ELSTER-Schnittstelle und serverseitige Verarbeitung. Für diesen MVP (Zero-Data/Client-Side) bewusst out of scope. Perspektivisch als Variante-B-Erweiterung denkbar.
- **Maschinelle Erstellung ohne Unterschrift** (R 10b.1 Abs. 4 EStR) — Erfordert Anzeige beim Finanzamt, manipulationssicheres System und direkte Buchhaltungsanbindung. Mit einer clientseitigen DOCX-App nicht prüfungssicher umsetzbar. Alle generierten Bestätigungen müssen ausgedruckt und händisch unterschrieben werden.
- **PDF-Export** zusätzlich zum DOCX (über Browser-Print oder serverseitig)
- **QR-Code auf der Bestätigung** mit Verifizierungslink
- **Multi-Mandantenfähigkeit** (mehrere Vereine/OVs auf einem Gerät) → wäre Variante B
- **Digitale Unterschrift** (qualifizierte elektronische Signatur)
- **Automatischer Abgleich** mit Bankkontodaten (CSV-Import von Kontoauszügen)
- **Spender-Portal** (Spender können eigene Quittungen abrufen) → wäre Variante B

---

## 10. Steuerrechtliche Sicherheitsmechanismen

Diese Mechanismen schützen den Vorstand vor persönlicher Haftung (§ 10b Abs. 4 EStG) und sind in der App als harte technische Sperren implementiert — nicht als wegklickbare Warnungen.

| # | Risiko | Mechanismus | Typ |
|---|--------|------------|-----|
| 1 | Abgelaufener Freistellungsbescheid (> 5 J.) | `FreistellungsBlocker.tsx` — Download-Button deaktiviert, Seite zeigt nur Fehlermeldung | 🔴 BLOCKER |
| 2 | Abgelaufener Feststellungsbescheid (> 3 J.) | Identisch zu #1 | 🔴 BLOCKER |
| 3 | Bescheid läuft in < 6 Monaten ab | Gelber Banner im Dashboard + auf Bestätigungs-Seiten | ⚠️ Warnung |
| 4 | DOCX ohne Unterschrift versendet | `UnterschriftHinweis.tsx` — Pflicht-Modal vor jedem Download | ⚠️ Pflicht-Hinweis |
| 5 | Sachspende ohne Wertermittlungsunterlagen | Pflicht-Checkbox „Unterlagen liegen vor" — ohne Haken kein Speichern | 🔴 BLOCKER |
| 6 | Aufwandsverzicht ohne rechtliche Grundlage | `AufwandsverzichtInfo.tsx` — Info-Callout bei Auswahl | ⚠️ Pflicht-Hinweis |
| 7 | Kein Backup / Doppel-Verlust | `BackupStatusAnzeige.tsx` — Ampel im Dashboard, rote Warnung ab > 90 Tage | ⚠️ Warnung |
| 8 | Jahresabschluss-Export vergessen | Erinnerung ab November, roter Hinweis ab Februar des Folgejahres | ⚠️ Warnung |
| 9 | Doppel nicht im Batch-Export | Doppel-Checkbox im Batch-Export IMMER aktiv, nicht abwählbar | 🔴 ERZWUNGEN |

---

## 11. DSGVO-Checkliste

- [x] Keine externen Requests an US-Dienste
- [x] Keine Cookies
- [x] Keine Datenbank (alles localStorage)
- [x] Hosting: Hetzner VPS + Docker + Caddy (Goldstandard)
- [x] `/impressum` vorhanden
- [x] `/datenschutz` vorhanden (mit tatsächlichem Zero-Data-Hinweis)
- [x] `/hilfe` vorhanden
- [x] `/spenden` vorhanden
- [x] XSS-Schutz (keine dangerouslySetInnerHTML, Input-Sanitierung)
- [x] Fonts: System-Stack
- [x] README.md nach Format
- [x] Personenbezogene Spenderdaten verlassen niemals den Browser
- [x] DOCX-Generierung vollständig clientseitig
- [x] JSON-Export für Portabilität (Nutzer hat volle Kontrolle)

---

## 12. Steuerrechtliche Checkliste

- [x] BMF-Muster Anlagen 3, 4, 14 im exakten Wortlaut (BMF vom 07.11.2013, BStBl I S. 1333)
- [x] Wortwahl und Reihenfolge beibehalten, keine Umformulierungen (BMF Nr. 2)
- [x] Haftungshinweis und Gültigkeitshinweis STETS enthalten (BMF Nr. 1)
- [x] Verzichtszeile STETS enthalten, auch bei Sammelbestätigungen (BMF Nr. 7)
- [x] Betrag in Ziffern UND Buchstaben (BMF Nr. 5)
- [x] **BLOCKER** bei abgelaufenem Freistellungs-/Feststellungsbescheid (§ 63 Abs. 5 AO)
- [x] **Pflicht-Unterschrift**: Eigenhändige Unterschrift erforderlich, kein maschinelles Verfahren
- [x] **Sachspenden**: Wertermittlungsunterlagen-Pflicht mit Blocker-Checkbox
- [x] **Aufwandsverzicht**: Info-Callout über satzungsmäßige/vertragliche Voraussetzungen
- [x] **Doppel**: Aufbewahrungspflicht 10 Jahre (§ 50 Abs. 7 EStDV), im Batch-Export erzwungen
- [x] **Backup-Ampel**: Dashboard-Warnung bei fehlendem/veraltetem Backup
- [x] **Sammelbestätigung**: Doppelbestätigungs-Ausschluss-Klausel enthalten
- [x] **Sammelbestätigung**: Anlage mit 4-Spalten-Tabelle (Datum, Art, Verzicht, Betrag)
- [x] **Kleinspenden ≤ 300 €**: Vereinfachter Spendennachweis mit BMF-Mindestangaben
- [x] Keine Danksagungen/Werbung auf Vorderseite der Bestätigung (BMF Nr. 2)
- [x] Max. DIN A4 pro Bestätigung (BMF Nr. 2)
- [x] Fortlaufende alphanumerische Kennzeichnung (BMF Nr. 3)

---

*DRK Kreisverband StädteRegion Aachen e.V. · Henry-Dunant-Platz 1, 52146 Würselen*
*Konzept erstellt: März 2026*
