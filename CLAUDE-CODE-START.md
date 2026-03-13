# DRK Spendenquittung – Claude Code Anleitung

> **Lies zuerst** `DRK-SPENDENQUITTUNG-KONZEPT.md` — dort stehen alle rechtlichen Grundlagen, das Datenmodell, die BMF-Mustertexte und die Feature-Beschreibungen. Dieses Dokument hier enthält die **ausführbaren Prompts** für Claude Code.

---

## Wichtige Regeln für ALLE Phasen

1. **Template-Basis:** Das Repo wurde aus `https://github.com/AFielen/drk-app-template.git` erstellt. Header, Footer, globals.css, Pflichtseiten-Grundstruktur sind vorhanden. Nicht überschreiben, nur erweitern.
2. **Nach jeder Phase:** `npm run build && tsc --noEmit` — muss fehlerfrei sein.
3. **CHANGELOG.md** bei jeder Änderung aktualisieren.
4. **Dateien aus Phase 1 (v1) dürfen in späteren Phasen geändert werden** — im Gegensatz zu NIS2-Audit gibt es hier kein v1-Freeze, weil die Phasen aufeinander aufbauen.
5. **BMF-Texte:** Die exakten Texte stehen in `DRK-SPENDENQUITTUNG-KONZEPT.md` Abschnitt 2 (Anlagen 3, 4, 14). Wortwahl und Reihenfolge NIEMALS ändern. Im Zweifel: Konzept lesen.
6. **TypeScript strict:** Keine `any`. Alle Interfaces aus `lib/types.ts`.
7. **Styling:** Tailwind für Layout, CSS-Variablen (`var(--drk)` etc.) für DRK-Farben. Keine externen Fonts/CDNs.

---

## Phase 0: Projekt vorbereiten (manuell, vor Claude Code)

```bash
# Repo klonen und Template-Platzhalter ersetzen
git clone https://github.com/AFielen/drk-app-template.git DRK-Spendenquittung
cd DRK-Spendenquittung
rm -rf .git && git init

# Platzhalter in layout.tsx ersetzen:
# APP_TITEL → "DRK Spendenquittung"
# APP_UNTERTITEL → "Zuwendungsbestätigungen für DRK-Verbände"
# APP_UNTERTITEL_KURZ → "Spendenquittungen"
# In metadata: title → "DRK Spendenquittung", description anpassen

# package.json: name → "drk-spendenquittung"

# next.config.ts → output auf 'standalone' ändern:
#   const nextConfig: NextConfig = { output: 'standalone' };

# Zusätzliche Pakete installieren:
npm install docx file-saver jszip
npm install -D @types/file-saver

# Dockerfile erstellen:
cat > Dockerfile << 'EOF'
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
EOF

# docker-compose.yml erstellen:
cat > docker-compose.yml << 'EOF'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
EOF

# .dockerignore erstellen:
cat > .dockerignore << 'EOF'
node_modules
.next
.git
*.md
EOF

# Konzept-Dateien ins Repo legen:
# DRK-SPENDENQUITTUNG-KONZEPT.md
# CLAUDE-CODE-START.md (diese Datei)

git add -A && git commit -m "feat: init from drk-app-template (standalone + Docker)"
```

**Deployment auf dem VPS:**

```bash
# Auf dem Hetzner VPS:
cd /opt/drk-spendenquittung
git pull
docker compose up -d --build

# Caddyfile ergänzen:
# drk-spendenquittung.de {
#     reverse_proxy localhost:3000
# }
# sudo systemctl reload caddy
```

---

## Phase 1: Grundgerüst & Vereins-Setup (Tag 1–2)

### Prompt 1.1 – Types, Storage, Routen

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 4 (Datenmodell) und Abschnitt 7 (Projektstruktur).

Erstelle lib/types.ts mit allen Interfaces: Verein, Spender, Zuwendung, AppSettings.
Übernimm die Typen exakt aus dem Konzept inkl. sachUnterlagenVorhanden, bestaetigungTyp, letztesBackup, letzterBatchExport.

Erstelle lib/storage.ts als generische localStorage-Abstraktion:
- getItem<T>(key: string): T | null
- setItem<T>(key: string, value: T): void
- removeItem(key: string): void
- Spezialisierte Funktionen: getVerein(), setVerein(), getSpender(), addSpender(), updateSpender(), deleteSpender(), getZuwendungen(), addZuwendung(), updateZuwendung(), deleteZuwendung(), getSettings(), updateSettings()
- Keys: 'drk-sq-verein', 'drk-sq-spender', 'drk-sq-spenden', 'drk-sq-settings'

Erstelle lib/version.ts: export const APP_VERSION = '0.1.0';

Erstelle lib/freistellung-check.ts:
- Funktion prüfFreistellung(verein: Verein): { status: 'gueltig' | 'warnung' | 'abgelaufen'; ablaufDatum: string; restMonate: number }
- Bei 'freistellungsbescheid': abgelaufen wenn > 5 Jahre seit freistellungDatum
- Bei 'feststellungsbescheid': abgelaufen wenn > 3 Jahre seit freistellungDatum
- Warnung wenn < 6 Monate bis Ablauf

Erstelle die Routen-Verzeichnisse (jeweils mit leerem page.tsx das nur eine Überschrift zeigt):
- app/einrichtung/page.tsx
- app/spender/page.tsx
- app/zuwendungen/page.tsx
- app/bestaetigung/page.tsx
- app/export/page.tsx
- app/daten/page.tsx

Ergebnis: Alle Types kompilieren, Storage-Layer funktional, alle Routen erreichbar.
Test: npm run build && tsc --noEmit
```

### Prompt 1.2 – Vereins-Setup-Wizard

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 5.2 (Vereins-Setup).

Implementiere app/einrichtung/page.tsx und components/VereinsSetupWizard.tsx als 3-Schritt-Wizard.

Schritt 1 – Stammdaten:
- Vereinsname (Pflicht), Straße, PLZ, Ort
- Vereinsregister (optional, z.B. "Amtsgericht Aachen VR 4535")
- Logo-Upload: Input type="file" accept="image/*", konvertiert zu Base64, zeigt Vorschau. Max 200KB. Gespeichert in verein.logoBase64

Schritt 2 – Steuerliche Angaben:
- Finanzamt (Freitext, Pflicht)
- Steuernummer (Pflicht)
- Freistellungsart als Radio-Buttons:
  ○ "Freistellungsbescheid / Anlage zum KSt-Bescheid" (value: 'freistellungsbescheid')
  ○ "Feststellungsbescheid nach § 60a AO" (value: 'feststellungsbescheid')
- Datum des Bescheids (date-Input, Pflicht)
- Letzter Veranlagungszeitraum (nur sichtbar bei 'freistellungsbescheid', z.B. "2023")
- Begünstigte Zwecke als Checkbox-Liste mit DRK-typischen Vorauswahlen:
  ☑ Förderung des Wohlfahrtswesens
  ☐ Förderung der Rettung aus Lebensgefahr
  ☐ Förderung des Katastrophenschutzes
  ☐ Förderung der Jugend- und Altenhilfe
  ☐ Förderung des bürgerschaftlichen Engagements
  + Freitext-Input für weitere Zwecke
  Mindestens ein Zweck muss ausgewählt sein.

- HARTER BLOCKER (FreistellungsBlocker-Logik inline):
  Nutze prüfFreistellung() aus lib/freistellung-check.ts.
  Wenn 'abgelaufen': Rote Box unter dem Datumsfeld mit Text:
  "⚠️ Dieser Bescheid ist abgelaufen. Sie dürfen keine Zuwendungsbestätigungen ausstellen, bis Sie aktuelle Bescheiddaten Ihres Finanzamts eingepflegt haben."
  Der "Weiter"-Button wird NICHT blockiert (Verein soll trotzdem eingerichtet werden können), aber der Blocker greift später auf /bestaetigung und /export.
  Wenn 'warnung': Gelbe Box mit Restlaufzeit.

Schritt 3 – Unterschrift:
- Name des Unterzeichners (Pflicht)
- Funktion (Pflicht, z.B. "Vorstandsvorsitzender", "Schatzmeister")
- Hinweis-Text: "Die generierten Zuwendungsbestätigungen müssen ausgedruckt und eigenhändig unterschrieben werden."

Nach Abschluss: Speichern via setVerein(), Weiterleitung zu /.

Startseite (app/page.tsx) anpassen:
- Wenn kein Verein → "Willkommen"-Box mit "Jetzt einrichten"-Button → /einrichtung
- Wenn Verein vorhanden → Platzhalter-Dashboard (wird in Phase 5 finalisiert)

Ergebnis: Wizard komplett, Daten persistiert, Freistellungs-Prüfung aktiv.
Test: npm run build && tsc --noEmit
```

---

## Phase 2: Spender & Zuwendungen (Tag 3–4)

### Prompt 2.1 – Spenderverwaltung

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 5.3 (Spenderverwaltung).

Implementiere app/spender/page.tsx mit components/SpenderTabelle.tsx und components/SpenderFormular.tsx.

SpenderTabelle.tsx:
- Tabelle mit Spalten: Name, Adresse, Zuwendungen (Anzahl), Jahressumme (€)
- Suchfeld (filtert nach Name und Ort)
- Sortierung per Klick auf Spaltenüberschriften (Name, Ort)
- Pro Zeile: Bearbeiten-Button (öffnet SpenderFormular), Löschen-Button
- Löschen: Bestätigungs-Dialog. Wenn Spender Zuwendungen hat: "Dieser Spender hat X Zuwendungen. Beim Löschen werden auch alle zugehörigen Zuwendungen gelöscht."
- Leere Tabelle: "Noch keine Spender angelegt. Legen Sie Ihren ersten Spender an."

SpenderFormular.tsx (als Modal):
- Anrede (optional: Herr/Frau/leer)
- Vorname (Pflicht), Nachname (Pflicht)
- Straße (Pflicht), PLZ (Pflicht), Ort (Pflicht)
- Steuer-ID (optional, Label: "Steuer-ID (optional, für perspektivische eZB)")
- Speichern-Button: UUID generieren (crypto.randomUUID()), Timestamps setzen

CSV-Import (Button über der Tabelle):
- Akzeptiert .csv-Dateien mit Semikolon oder Komma als Trenner
- Erwartet Spalten: Vorname;Nachname;Straße;PLZ;Ort
- Erste Zeile als Header erkennen und überspringen
- Duplikat-Erkennung: Wenn Vorname+Nachname+PLZ bereits existiert → überspringen und melden
- Vorschau-Dialog vor Import: "X neue Spender gefunden, Y Duplikate übersprungen"

Ergebnis: Spender-CRUD funktional, CSV-Import getestet.
Test: npm run build && tsc --noEmit
```

### Prompt 2.2 – Zuwendungen erfassen

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 5.4 (Zuwendungen erfassen).

Implementiere app/zuwendungen/page.tsx mit components/ZuwendungTabelle.tsx und components/ZuwendungFormular.tsx.

ZuwendungTabelle.tsx:
- Filter-Leiste: Spender (Dropdown), Jahr (Dropdown), Art (Geld/Sach/Alle), Status (Offen/Bestätigt/Alle)
- Tabelle: Datum, Spender, Art, Betrag/Wert, Verwendung, Status, Aktionen
- Summenzeile am Ende: "Gesamt: X €"
- Bearbeiten/Löschen pro Zeile (Löschen nur wenn noch nicht bestätigt)

ZuwendungFormular.tsx (als Modal):
- Spender-Auswahl: Dropdown mit Suchfunktion (filtert getSpender())
- Toggle: "Geldspende" / "Sachspende" (zwei Tab-Buttons)

Bei Geldspende:
- Betrag (€, number, Pflicht, min 0.01)
- Datum (date, Pflicht)
- Verwendung: Radio "Spende" / "Mitgliedsbeitrag"
- Zahlungsart: Select (Überweisung/Bar/Lastschrift/PayPal/Sonstige) — optional
- Checkbox "Verzicht auf Erstattung von Aufwendungen" (default: nein)
  → Wenn angehakt: Zeige components/AufwandsverzichtInfo.tsx als gelbe Info-Box:
  "⚠️ Ein Aufwandsverzicht ist nur steuerlich abziehbar, wenn der Anspruch auf Erstattung VOR der Tätigkeit rechtswirksam eingeräumt wurde (z.B. durch Satzung, Vorstandsbeschluss oder Vertrag) und der Verzicht zeitnah erfolgt. Stellen Sie sicher, dass die entsprechenden Grundlagen dokumentiert vorliegen."

Bei Sachspende:
- Bezeichnung des Gegenstands (Pflicht, Freitext)
- Alter (Freitext, z.B. "ca. 3 Jahre")
- Zustand (Freitext, z.B. "gut erhalten")
- Historischer Kaufpreis (€, optional)
- Angesetzter Wert (€, Pflicht)
- Datum (date, Pflicht)
- Herkunft: Radio "Privatvermögen" / "Betriebsvermögen" / "Keine Angabe des Zuwendenden"
- Bei Betriebsvermögen: zusätzlich Entnahmewert (€) + Umsatzsteuer (€)
- Unterlagen zur Wertermittlung (Freitext, z.B. "Rechnung vom 15.03.2024")
- PFLICHT-Checkbox "Geeignete Unterlagen zur Wertermittlung liegen vor" — muss angehakt sein, sonst kein Speichern möglich
- components/SachspendenHinweise.tsx IMMER sichtbar (nicht wegklickbar):
  "📋 Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten, Zeitwertberechnung) müssen dem Doppel der Zuwendungsbestätigung in Ihrer Vereinsakte zwingend beigefügt werden (BMF Nr. 6)."

Bei Betrag ≤ 300 €:
- components/KleinspendenHinweis.tsx: Blaue Info-Box:
  "ℹ️ Für Zuwendungen bis 300 € kann der Spender den Spendenabzug auch mit einem Kontoauszug + vereinfachtem Nachweis belegen. Sie können trotzdem eine volle Zuwendungsbestätigung erstellen."

Speichern: UUID, Timestamps, bestaetigungErstellt: false

Ergebnis: Zuwendungen erfassbar, alle steuerrechtlichen Hinweise integriert.
Test: npm run build && tsc --noEmit
```

---

## Phase 3: DOCX-Generierung (Tag 5–7)

### Prompt 3.1 – BMF-Textbausteine & Betrag-Konverter

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 2, insbesondere die exakten Texte der Anlagen 3, 4, 14 und die Regeln Nr. 1–16.

Erstelle lib/docx-templates/shared.ts mit allen BMF-Pflicht-Textbausteinen als exportierte Konstanten.
EXAKTER WORTLAUT — keine Umformulierungen (BMF Nr. 2)!

Exportiere folgende Konstanten:

TITEL_GELDZUWENDUNG = "Bestätigung über Geldzuwendungen/Mitgliedsbeitrag\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen"

TITEL_SACHZUWENDUNG = "Bestätigung über Sachzuwendungen\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen"

TITEL_SAMMELBESTAETIGUNG = "Sammelbestätigung über Geldzuwendungen/Mitgliedsbeiträge\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen"

Exportiere Funktionen die den Freistellungstext mit eingesetzten Werten zurückgeben:

freistellungTextA(finanzamt: string, stNr: string, datum: string, veranlagungszeitraum: string, zwecke: string): string
→ "Wir sind wegen Förderung {zwecke} nach dem Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes {finanzamt} StNr. {stNr}, vom {datum} für den letzten Veranlagungszeitraum {veranlagungszeitraum} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit."

freistellungTextB(finanzamt: string, stNr: string, datum: string, zwecke: string): string
→ "Die Einhaltung der satzungsmäßigen Voraussetzungen nach den §§ 51, 59, 60 und 61 AO wurde vom Finanzamt {finanzamt}, StNr. {stNr} mit Bescheid vom {datum} nach § 60a AO gesondert festgestellt. Wir fördern nach unserer Satzung {zwecke}."

Weitere Konstanten:
VERWENDUNGSBESTAETIGUNG_PREFIX = "Es wird bestätigt, dass die Zuwendung nur zur Förderung "
VERWENDUNGSBESTAETIGUNG_SUFFIX = " verwendet wird."

MITGLIEDSBEITRAG_HINWEIS = "Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag handelt, dessen Abzug nach § 10b Abs. 1 des Einkommensteuergesetzes ausgeschlossen ist."

SAMMEL_DOPPELBESTAETIGUNG = "Es wird bestätigt, dass über die in der Gesamtsumme enthaltenen Zuwendungen keine weiteren Bestätigungen, weder formelle Zuwendungsbestätigungen noch Beitragsquittungen oder Ähnliches ausgestellt wurden und werden."

SAMMEL_VERZICHTHINWEIS = "Ob es sich um den Verzicht auf Erstattung von Aufwendungen handelt, ist der Anlage zur Sammelbestätigung zu entnehmen."

HAFTUNGSHINWEIS = "Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung erstellt oder veranlasst, dass Zuwendungen nicht zu den in der Zuwendungsbestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet für die entgangene Steuer (§ 10b Abs. 4 EStG, § 9 Abs. 3 KStG, § 9 Nr. 5 GewStG)."

GUELTIGKEITSHINWEIS = "Diese Bestätigung wird nicht als Nachweis für die steuerliche Berücksichtigung der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides länger als 5 Jahre bzw. das Datum der Feststellung der Einhaltung der satzungsmäßigen Voraussetzungen nach § 60a Abs. 1 AO länger als 3 Jahre seit Ausstellung des Bescheides zurückliegt (§ 63 Abs. 5 AO)."

SACHSPENDE_BETRIEBSVERMOEGEN = "Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem Betriebsvermögen. Die Zuwendung wurde nach dem Wert der Entnahme (ggf. mit dem niedrigeren gemeinen Wert) und nach der Umsatzsteuer, die auf die Entnahme entfällt, bewertet."

SACHSPENDE_PRIVATVERMOEGEN = "Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem Privatvermögen."

SACHSPENDE_KEINE_ANGABE = "Der Zuwendende hat trotz Aufforderung keine Angaben zur Herkunft der Sachzuwendung gemacht."

SACHSPENDE_UNTERLAGEN = "Geeignete Unterlagen, die zur Wertermittlung gedient haben, z. B. Rechnung, Gutachten, liegen vor."

---

Erstelle lib/docx-templates/betrag-in-worten.ts:

export function betragInWorten(betrag: number): string
- Deutsche Zahlwörter, korrekt bis 999.999.999,99 €
- Beispiele:
  0.00 → "null Euro"
  1.00 → "ein Euro"
  1.01 → "ein Euro und ein Cent"
  23.50 → "dreiundzwanzig Euro und fünfzig Cent"
  100.00 → "einhundert Euro"
  1322.50 → "eintausenddreihundertzweiundzwanzig Euro und fünfzig Cent"
  10000.00 → "zehntausend Euro"
- Kein "und" zwischen Tausendern und Hundertern (deutsch: "eintausenddreihundert", nicht "eintausend und dreihundert")
- Bei 0 Cent: nur "... Euro" (ohne "und null Cent")

Schreibe Testfälle als Kommentare über die Funktion.

Ergebnis: Alle Textbausteine als typisierte Konstanten, Betrag-Konverter korrekt.
Test: npm run build && tsc --noEmit
```

### Prompt 3.2 – DOCX Geldzuwendung (Anlage 3)

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 2 "Anlage 3 — Exakter Aufbau" und Abschnitt 6 (DOCX-Generierung).

Erstelle lib/docx-templates/geldzuwendung.ts.
Nutze das npm-Paket 'docx' (import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Footer, PageNumber, Header } from 'docx').

Exportiere: async function generateGeldzuwendung(verein: Verein, spender: Spender, zuwendung: Zuwendung, laufendeNr: string): Promise<Blob>

DOCX-Aufbau — Reihenfolge exakt wie BMF-Anlage 3:

1. Seitenformat: A4, Ränder: 25mm links, 20mm rechts, 20mm oben, 20mm unten
   (DXA: links 1418, rechts 1134, oben 1134, unten 1134)

2. Optional: Logo oben links aus verein.logoBase64 (max 2cm × 2cm = 1143 EMU × 1143 EMU). Nur wenn vorhanden.

3. Aussteller-Block: Vereinsname (fett) + Adresse, Arial 10pt

4. Leerzeile

5. Titel: TITEL_GELDZUWENDUNG aus shared.ts — Arial 11pt, fett, zentriert

6. Leerzeile

7. "Name und Anschrift des Zuwendenden:" (Arial 10pt, fett)
   Darunter: "{anrede} {vorname} {nachname}\n{strasse}\n{plz} {ort}" (Arial 10pt)

8. Leerzeile

9. Betrag-Zeile: "Betrag der Zuwendung  - in Ziffern -  {betrag} €  - in Buchstaben -  {betragInWorten(betrag)}" (Arial 10pt)

10. "Tag der Zuwendung: {datum formatiert als TT.MM.JJJJ}" (Arial 10pt)

11. Leerzeile

12. "Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja ☑ / Nein ☐" oder "Ja ☐ / Nein ☑"
    (Nutze Unicode ☑ U+2611 und ☐ U+2610)

13. Leerzeile

14. Freistellungsstatus — je nach verein.freistellungsart:
    Bei 'freistellungsbescheid': "☑ " + freistellungTextA(verein.finanzamt, verein.steuernummer, formatDatum(verein.freistellungDatum), verein.letzterVeranlagungszeitraum, verein.beguenstigteZwecke.join(', '))
    Bei 'feststellungsbescheid': "☑ " + freistellungTextB(...)
    (Arial 9pt, der nicht zutreffende Block wird NICHT mit aufgenommen — in einem auf den Zuwendungsempfänger zugeschnittenen Formular müssen nur einschlägige Angaben übernommen werden, BMF Nr. 1)

15. Leerzeile

16. VERWENDUNGSBESTAETIGUNG_PREFIX + verein.beguenstigteZwecke.join(', ') + VERWENDUNGSBESTAETIGUNG_SUFFIX (Arial 10pt, fett)

17. Leerzeile

18. Absatz "Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge steuerlich nicht abziehbar sind:" (Arial 8pt, kursiv)
    "☐ " + MITGLIEDSBEITRAG_HINWEIS (Arial 9pt)
    (DRK-Beiträge SIND abziehbar → Checkbox NICHT angehakt. Zeile trotzdem enthalten.)

19. Leerzeilen für Abstand

20. Unterschriftenzeile:
    Linke Seite: "________________________________"
    Darunter: "(Ort, Datum und Unterschrift des Zuwendungsempfängers)"
    Rechte Seite: verein.unterschriftName + ", " + verein.unterschriftFunktion
    (Arial 9pt)

21. Leerzeile

22. "Hinweis:" (Arial 8pt, fett)
    HAFTUNGSHINWEIS (Arial 8pt)
    Leerzeile
    GUELTIGKEITSHINWEIS (Arial 8pt)

23. Fußzeile: "Lfd. Nr.: {laufendeNr}" (Arial 7pt, rechtsbündig)

Benutze Packer.toBlob(doc) als Return-Wert.

Ergebnis: DOCX öffnet korrekt in Word und LibreOffice, enthält alle BMF-Pflichtangaben.
Test: npm run build && tsc --noEmit
```

### Prompt 3.3 – DOCX Sachzuwendung (Anlage 4) + Sammelbestätigung (Anlage 14)

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 2 "Anlage 4" und "Anlage 14".

Erstelle lib/docx-templates/sachzuwendung.ts — analog zu geldzuwendung.ts, aber:
- Titel: TITEL_SACHZUWENDUNG
- "Wert der Zuwendung" statt "Betrag der Zuwendung"
- Nach "Tag der Zuwendung": Abschnitt "Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw."
  → Mehrzeiliger Freitext aus zuwendung.sachBezeichnung + sachAlter + sachZustand + sachKaufpreis
- 4 Checkboxen (je nach zuwendung.sachHerkunft und sachUnterlagenVorhanden):
  ☐/☑ SACHSPENDE_BETRIEBSVERMOEGEN
  ☐/☑ SACHSPENDE_PRIVATVERMOEGEN
  ☐/☑ SACHSPENDE_KEINE_ANGABE
  ☐/☑ SACHSPENDE_UNTERLAGEN
- Dann Freistellungsstatus (wie Anlage 3)
- Verwendungsbestätigung
- KEIN Mitgliedsbeitrag-Hinweis (Anlage 4 hat diesen nicht)
- Haftungs-/Gültigkeitshinweis

Export: async function generateSachzuwendung(verein: Verein, spender: Spender, zuwendung: Zuwendung, laufendeNr: string): Promise<Blob>

---

Erstelle lib/docx-templates/sammelbestaetigung.ts:
- Titel: TITEL_SAMMELBESTAETIGUNG
- "Gesamtbetrag der Zuwendung" statt "Betrag" — Summe aller übergebenen Zuwendungen
- "Zeitraum der Sammelbestätigung: {startDatum} bis {endDatum}" statt "Tag der Zuwendung"
- Freistellungsstatus + Verwendungsbestätigung + Mitgliedsbeitrag-Hinweis (wie Anlage 3)
- SAMMEL_DOPPELBESTAETIGUNG als eigener Absatz
- SAMMEL_VERZICHTHINWEIS als eigener Absatz
- Unterschrift + Haftungs-/Gültigkeitshinweis

SEITE 2 — "Anlage zur Sammelbestätigung" (PageBreak davor):
- Überschrift "Anlage zur Sammelbestätigung" (Arial 11pt, fett)
- Name des Zuwendenden (zum Identifizieren, BMF Nr. 9)
- Tabelle mit exakt 4 Spalten:
  | Datum der Zuwendung | Art der Zuwendung (Geldzuwendung/Mitgliedsbeitrag) | Verzicht auf die Erstattung von Aufwendungen (ja/nein) | Betrag |
- Eine Zeile pro Zuwendung
- Letzte Zeile: "Gesamtsumme" fett, rechtsbündig
- Nutze docx Table mit borders, cell padding, saubere Spaltenbreiten

Export: async function generateSammelbestaetigung(verein: Verein, spender: Spender, zuwendungen: Zuwendung[], zeitraumVon: string, zeitraumBis: string, laufendeNr: string): Promise<Blob>

Ergebnis: Beide Templates generieren BMF-konforme DOCX-Dateien.
Test: npm run build && tsc --noEmit
```

### Prompt 3.4 – Vereinfachter Spendennachweis + Doppel-Kennzeichnung

```
Erstelle lib/docx-templates/vereinfachter-nachweis.ts:
Für Spenden ≤ 300 € (§ 50 Abs. 4 EStDV). Abgerüstetes Dokument mit BMF-Mindestangaben:
- Vereinsname + Anschrift
- Freistellungsdaten (Finanzamt, StNr, Datum, Veranlagungszeitraum)
- Steuerbegünstigter Zweck
- Angabe ob Spende oder Mitgliedsbeitrag
- Name des Spenders, Betrag, Datum
- KEIN Haftungshinweis nötig, KEINE Unterschrift nötig
- Hinweis: "Dieser Beleg dient zusammen mit Ihrem Kontoauszug als vereinfachter Zuwendungsnachweis gemäß § 50 Abs. 4 EStDV."

Export: async function generateVereinfachterNachweis(verein: Verein, spender: Spender, zuwendung: Zuwendung): Promise<Blob>

---

Erstelle lib/docx-templates/doppel.ts:
Wrapper-Funktion die ein beliebiges DOCX-Template aufruft und den Text "— DOPPEL — Kopie für die Vereinsakte (Aufbewahrungspflicht: 10 Jahre gemäß § 50 Abs. 7 EStDV)" als grauen Absatz ganz oben vor dem Aussteller einfügt.

Export: async function generateDoppel(originalGenerator: () => Promise<Blob>): Promise<Blob>
Hinweis: Das ist technisch schwierig per Wrapper zu lösen. Alternativ: Füge in jede generate-Funktion einen optionalen Parameter `doppel: boolean = false` ein. Wenn true, wird der "DOPPEL"-Absatz oben eingefügt.

Ergebnis: Alle 4 DOCX-Templates + Doppel-Variante funktional.
Test: npm run build && tsc --noEmit
```

---

## Phase 4: Bestätigungsworkflow & Export (Tag 8–10)

### Prompt 4.1 – Bestätigungsseite

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 5.5 (Bestätigung erstellen) und Abschnitt 10 (Steuerrechtliche Sicherheitsmechanismen).

Implementiere app/bestaetigung/page.tsx mit drei Tabs.

VORAB-PRÜFUNG (bei jedem Seitenaufruf):
Erstelle components/FreistellungsBlocker.tsx:
- Ruft prüfFreistellung(verein) auf
- Wenn 'abgelaufen': Rendert NUR eine rote Vollbild-Box:
  "❌ Ihr Freistellungs-/Feststellungsbescheid ist abgelaufen."
  "Der Verein darf bei abgelaufenen Bescheiden keine Zuwendungsbestätigungen ausstellen (§ 63 Abs. 5 AO)."
  "Bitte aktualisieren Sie die Bescheiddaten unter → Einrichtung"
  Link-Button zu /einrichtung. KEINE anderen UI-Elemente sichtbar. KEIN Download möglich.
- Wenn 'warnung': Gelber Banner OBEN auf der Seite (über den Tabs):
  "⚠️ Ihr Bescheid läuft am {datum} ab (noch {restMonate} Monate). Bitte kümmern Sie sich rechtzeitig um die Verlängerung."
- Wenn 'gueltig': Nichts anzeigen

Tab 1 — Einzelbestätigung:
1. Spender-Auswahl (Dropdown mit Suche)
2. Liste der offenen (nicht bestätigten) Zuwendungen des Spenders
3. Zuwendung auswählen → zeigt BestaetigungVorschau.tsx (read-only Vorschau des generierten BMF-Textes als formatiertes HTML, NICHT editierbar)
4. "DOCX herunterladen"-Button → ruft generateGeldzuwendung() oder generateSachzuwendung() auf
   VOR dem Download: components/UnterschriftHinweis.tsx als Modal:
   "✍️ Bitte drucken Sie die Zuwendungsbestätigung aus und unterschreiben Sie eigenhändig."
   "Ohne Unterschrift ist die Bestätigung steuerlich nicht anerkennungsfähig."
   Checkbox: "☐ Doppel für Vereinsakte miterzeugen" (erzeugt zweites DOCX mit doppel: true)
   Buttons: "Herunterladen" / "Abbrechen"
5. Nach Download: Zuwendung als bestätigt markieren, laufende Nr. vergeben

Tab 2 — Sammelbestätigung:
1. Spender-Auswahl
2. Zeitraum: Von/Bis (default: 01.01.–31.12. des aktuellen Jahres)
3. Liste aller Geldzuwendungen im Zeitraum + Gesamtsumme
4. Vorschau (inkl. Tabelle der Anlage)
5. Download mit UnterschriftHinweis-Modal (wie oben)
6. Alle enthaltenen Zuwendungen als bestätigt markiert

Tab 3 — Vereinfachter Nachweis (≤ 300 €):
1. Spender-Auswahl
2. Nur Zuwendungen ≤ 300 € anzeigen
3. Download → generateVereinfachterNachweis()
4. KEIN UnterschriftHinweis nötig (kein Pflicht-Formular)

Laufende-Nummern-Logik:
- Nächste Nr. aus settings.laufendeNrAktuell
- Format aus settings.laufendeNrFormat (default: "SQ-{JAHR}-{NR}")
  {JAHR} → aktuelles Jahr, {NR} → 3-stellig mit führenden Nullen
- Bei Jahreswechsel (settings.laufendeNrJahr !== aktuelles Jahr): Nr. auf 1 zurücksetzen
- Nach Vergabe: laufendeNrAktuell + 1 speichern

Ergebnis: Vollständiger Bestätigungs-Workflow mit allen Sicherheitsmechanismen.
Test: npm run build && tsc --noEmit
```

### Prompt 4.2 – Batch-Export

```
Lies DRK-SPENDENQUITTUNG-KONZEPT.md Abschnitt 5.6 (Batch-Export).

Implementiere app/export/page.tsx mit components/BatchExport.tsx.

VORAB: FreistellungsBlocker.tsx einbinden (wie bei /bestaetigung).

BatchExport.tsx:
1. Jahr-Auswahl (Dropdown mit allen Jahren in denen Zuwendungen existieren)
2. Übersicht: Anzahl Spender, Anzahl Zuwendungen, Gesamtsumme
3. Checkboxen:
   ☑ Sammelbestätigungen für alle Spender mit Geldzuwendungen im Jahr
   ☑ Einzelbestätigungen für Sachzuwendungen im Jahr
   ☑ Vereinfachte Nachweise für Zuwendungen ≤ 300 € (ohne volle Bestätigung)
   ☑ Doppel für Vereinsakte — IMMER AKTIVIERT, GRAU, NICHT ABWÄHLBAR
     Darunter: "(Pflicht gemäß § 50 Abs. 7 EStDV — 10 Jahre Aufbewahrung)"

4. "ZIP exportieren"-Button:
   - Fortschrittsbalken: "Generiere Bestätigung X von Y..."
   - JSZip: Erstellt ZIP mit Ordnerstruktur:
     /Bestaetigungen/{Nachname}_{Vorname}_Sammelbestaetigung_{Jahr}.docx
     /Bestaetigungen/{Nachname}_{Vorname}_Sachzuwendung_{Datum}.docx
     /Vereinfacht/{Nachname}_{Vorname}_Nachweis_{Datum}.docx
     /Doppel/{Nachname}_{Vorname}_Sammelbestaetigung_{Jahr}_DOPPEL.docx
     /Doppel/{Nachname}_{Vorname}_Sachzuwendung_{Datum}_DOPPEL.docx
     Uebersicht_{Jahr}.csv — Spalten: Lfd.Nr, Nachname, Vorname, Art, Betrag, Datum, Typ

5. Nach Download: Pflicht-Hinweis-Modal (5 Sekunden sichtbar, "Verstanden"-Button erst nach 5 Sek.):
   "📁 Bitte speichern Sie diese ZIP-Datei an einem sicheren Ort (z.B. Vereins-NAS, USB-Stick, externer Datenträger)."
   "Der Ordner 'Doppel' muss gemäß § 50 Abs. 7 EStDV mindestens 10 Jahre aufbewahrt werden."

6. settings.letzterBatchExport auf aktuelles Datum setzen

Ergebnis: ZIP-Download mit allen Bestätigungen + Doppel + CSV-Übersicht.
Test: npm run build && tsc --noEmit
```

### Prompt 4.3 – Daten-Management

```
Implementiere app/daten/page.tsx mit components/DatenManager.tsx.

Drei Sektionen auf der Seite:

Sektion 1 — Backup:
- components/BackupStatusAnzeige.tsx (prominent oben):
  Liest settings.letztesBackup und settings.letzterBatchExport
  🟢 < 30 Tage: "✅ Letztes Backup: {datum}" (grüner Rahmen)
  🟡 30–90 Tage: "⚠️ Backup überfällig! Ihre Daten existieren nur in diesem Browser." (gelber Rahmen)
  🔴 > 90 Tage oder nie: "❌ KEIN AKTUELLES BACKUP! Bei Verlust der Browserdaten gehen alle Daten und Doppel unwiederbringlich verloren." (roter Rahmen, pulsierend)
- "JSON-Backup erstellen"-Button → Exportiert alle localStorage-Keys als JSON, Download als drk-spendenquittung-backup-{YYYY-MM-DD}.json, setzt settings.letztesBackup
- "JSON-Backup importieren"-Button → Upload, Merge-Logik (neuere Timestamps gewinnen bei gleicher ID), Vorschau: "X Spender, Y Zuwendungen gefunden. Z davon neu."

Sektion 2 — Statistik:
- components/StatistikKarten.tsx:
  Karte 1: Anzahl Spender
  Karte 2: Zuwendungen aktuelles Jahr (Anzahl + Summe)
  Karte 3: Offene Bestätigungen (noch nicht erstellt)
  Karte 4: Zuwendungen pro Jahr (einfaches CSS-Balkendiagramm der letzten 5 Jahre)

Sektion 3 — Gefahrenzone:
- "Alle Daten löschen" (roter Button, unten)
  Schritt 1: "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden."
  Schritt 2: Prüfe letztesBackup. Wenn > 24h oder nie: "⚠️ Sie haben kein aktuelles Backup. Bitte erstellen Sie zuerst einen Export." + Backup-Button
  Schritt 3: "Bitte geben Sie LÖSCHEN ein, um zu bestätigen." → Input-Feld, nur exakt "LÖSCHEN" löst Löschung aus
  Löscht alle 4 localStorage-Keys

Ergebnis: Datenmanagement mit Backup-Tracking und Ampel-Status.
Test: npm run build && tsc --noEmit
```

---

## Phase 5: Polish & Pflichtseiten (Tag 11–12)

### Prompt 5.1 – Pflichtseiten + Hilfe

```
Aktualisiere die Pflichtseiten (existieren bereits aus Template, müssen aber inhaltlich angepasst werden):

app/impressum/page.tsx:
- DRK Kreisverband StädteRegion Aachen e.V.
- Henry-Dunant-Platz 1, 52146 Würselen
- E-Mail: Info@DRK-Aachen.de
- Vertretung: Vorstandsvorsitzender (Name einfügen)
- Amtsgericht Aachen VR 4535
- USt-ID: DE121729631
- Verantwortlich für den Inhalt: (Name)

app/datenschutz/page.tsx:
- Verantwortlicher: DRK KV Aachen (Adresse)
- Zero-Data-Erklärung: "Diese Anwendung speichert KEINE Daten auf einem Server. Alle Daten (Vereinsdaten, Spenderinformationen, Zuwendungen) werden ausschließlich im localStorage Ihres Browsers gespeichert und verlassen Ihr Gerät zu keinem Zeitpunkt."
- Keine Cookies, keine externen Dienste, keine Analytics, keine Tracking-Dienste
- Keine Datenübertragung an Dritte
- DOCX-Dateien werden clientseitig generiert
- Betroffenenrechte (Art. 15–21 DSGVO): Da keine serverseitige Speicherung erfolgt, haben Sie volle Kontrolle über Ihre Daten. Löschen Sie die Browserdaten, sind alle Daten entfernt.

app/hilfe/page.tsx — FAQ mit <details>-Elementen:
1. "Was ist eine Zuwendungsbestätigung?" → Kurze Erklärung, Verweis auf § 10b EStG
2. "Welche BMF-Muster werden verwendet?" → Anlagen 3, 4, 14 des BMF-Schreibens vom 07.11.2013
3. "Muss ich die Bestätigung unterschreiben?" → "Ja, eigenhändig. Diese App generiert ein vorausgefülltes DOCX-Dokument. Es muss ausgedruckt und vom Unterschriftsberechtigten des Vereins händisch unterschrieben werden. Eine maschinelle Erstellung ohne Unterschrift erfordert eine Genehmigung des Finanzamts, die mit dieser App nicht abgedeckt ist."
4. "Wie lange ist mein Freistellungsbescheid gültig?" → "5 Jahre ab Bescheiddatum (Freistellungsbescheid) bzw. 3 Jahre (Feststellungsbescheid nach § 60a AO). Nach Ablauf dürfen KEINE Zuwendungsbestätigungen mehr ausgestellt werden. Die App blockiert den Download automatisch."
5. "Was muss ich bei Sachspenden beachten?" → Genaue Beschreibung, Wertermittlung, Unterlagen beim Doppel aufbewahren
6. "Was ist ein Aufwandsverzicht?" → Voraussetzungen: Anspruch VOR Tätigkeit eingeräumt, Verzicht zeitnah
7. "Wie lange muss ich die Doppel aufbewahren?" → "10 Jahre gemäß § 50 Abs. 7 EStDV. Der Batch-Export erstellt automatisch Doppel-Kopien aller Bestätigungen."
8. "Wo sind meine Daten gespeichert?" → "Im localStorage Ihres Browsers. ACHTUNG: Wenn Sie Ihre Browserdaten löschen, sind alle Daten weg. Erstellen Sie regelmäßig JSON-Backups über die Daten-Seite."
9. "Kann ich die Daten auf ein anderes Gerät übertragen?" → "Ja, über JSON-Export und -Import auf der Daten-Seite."
10. "Brauche ich für Spenden unter 300 € eine Bestätigung?" → "Nein, ein vereinfachter Spendennachweis reicht in Kombination mit dem Kontoauszug. Die App bietet beide Optionen an."
+ Kontakt-Box: digitalisierung@drk-aachen.de

app/spenden/page.tsx: Aus Template bereits vorhanden, ggf. anpassen.

Ergebnis: Alle Pflichtseiten mit korrekten Inhalten.
Test: npm run build && tsc --noEmit
```

### Prompt 5.2 – Dashboard finalisieren

```
Finalisiere app/page.tsx (Startseite/Dashboard):

Drei Zustände:

Zustand 1 — Erststart (kein Verein konfiguriert):
- Willkommens-Box (drk-card): "Willkommen bei DRK Spendenquittung"
- Kurzbeschreibung: "Erstellen Sie Zuwendungsbestätigungen nach den verbindlichen BMF-Mustern — direkt im Browser, ohne Server, DSGVO-konform."
- Großer Button: "Jetzt einrichten →" → /einrichtung

Zustand 2 — Verein konfiguriert, aber keine Spender:
- Begrüßung: "Hallo, {vereinsname}"
- FreistellungsBlocker.tsx (Status-Anzeige)
- Hinweis: "Legen Sie Ihren ersten Spender an, um Zuwendungsbestätigungen zu erstellen."
- Button: "Spender anlegen →" → /spender

Zustand 3 — Regulärer Betrieb:
- Obere Zeile: FreistellungsBlocker.tsx (Ampel-Status) + BackupStatusAnzeige.tsx (Ampel-Status) — nebeneinander auf Desktop, untereinander auf Mobile

- StatistikKarten.tsx (4 Karten in 2×2 Grid):
  - Anzahl Spender
  - Zuwendungen aktuelles Jahr (Summe €)
  - Offene Bestätigungen
  - Letzte Aktivität (Datum der letzten Zuwendung/Bestätigung)

- Schnellzugriff-Buttons (Box mit 5 Buttons):
  "Neue Zuwendung" → /zuwendungen
  "Einzelbestätigung" → /bestaetigung
  "Sammelbestätigung" → /bestaetigung (Tab 2)
  "Jahresabschluss-Export" → /export
  "Backup erstellen" → /daten

- Jahresabschluss-Erinnerung:
  Ab 1. November: Gelbe Box "Jahresabschluss-Export für {Jahr} empfohlen → Export starten"
  Ab 1. Februar (Vorjahr nicht exportiert): Rote Box "Jahresabschluss {Vorjahr} noch nicht erstellt!"

- Exit-Guard: window.addEventListener('beforeunload') wenn ungespeicherte Formular-Daten existieren

Mobile-Optimierung (GESAMTE App):
- Tabellen auf < 768px: Als Card-Layout (jede Zeile wird zu einer Karte)
- Touch-Targets: Alle Buttons/Links mindestens 44×44px
- Modals: Auf < 768px als Bottom-Sheet (Position fixed, bottom: 0, rounded-top)

Erstelle README.md nach DRK-Template-Vorgabe (siehe CLAUDE.md):
- Titel mit 🧾 Emoji: "DRK Spendenquittung"
- Tagline: "Open Source · Kostenlos · DSGVO-konform"
- Features: BMF-konforme DOCX-Generierung, Sammelbestätigungen, Batch-Export, Zero-Data
- Tech-Stack, Projektstruktur, Installation, Datenschutz, Lizenz (MIT)

CHANGELOG.md aktualisieren mit allen Features.

Ergebnis: App vollständig, mobil nutzbar, alle Sicherheitsmechanismen aktiv, README fertig.
Test: npm run build && tsc --noEmit
```

---

## Abschluss-Check

Nach Abschluss aller 5 Phasen muss gelten:

- [ ] `npm run build` fehlerfrei
- [ ] `tsc --noEmit` fehlerfrei
- [ ] Alle Routen erreichbar: /, /einrichtung, /spender, /zuwendungen, /bestaetigung, /export, /daten, /impressum, /datenschutz, /hilfe, /spenden
- [ ] Vereins-Setup → Spender anlegen → Zuwendung erfassen → Bestätigung erstellen → DOCX öffnet korrekt in Word/LibreOffice
- [ ] Freistellungs-Blocker blockiert Download bei abgelaufenem Bescheid
- [ ] Unterschrift-Hinweis erscheint vor jedem Download
- [ ] Sachspende: Unterlagen-Checkbox erzwungen
- [ ] Aufwandsverzicht: Info-Callout erscheint
- [ ] Batch-Export: Doppel nicht abwählbar, Pflicht-Hinweis nach Download
- [ ] Backup-Ampel im Dashboard funktional
- [ ] JSON-Export/-Import funktional
- [ ] Mobile: Cards statt Tabellen, Touch-Targets 44px
