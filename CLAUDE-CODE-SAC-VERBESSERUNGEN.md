# DRK Spendenquittung – SAC-Verbesserungen (Claude Code Anweisung)

> **Kontext:** Die KPMG Self-Audit-Checkliste (SAC) zum Spenden- und Fördermittelmanagement hat bestätigt, dass die organisatorischen Prozesse des DRK KV Städteregion Aachen funktionieren. Diese 5 Features heben die bestehenden Prozesse (Dienstanweisung, Standardprozess Spendenabwicklung) auf eine technische Ebene – von "wir haben eine Dienstanweisung" zu "die Software lässt es gar nicht anders zu".
>
> **Reihenfolge:** Die Features bauen aufeinander auf. Jede Phase muss mit `npm run build && tsc --noEmit` fehlerfrei kompilieren, bevor die nächste beginnt.
>
> **Konventionen:** Lies `CLAUDE.md` und `INFRASTRUCTURE.md`. Prisma ist der ORM (bereits eingerichtet). Styling: Tailwind + CSS-Variablen (`var(--drk)` etc.). TypeScript strict, keine `any`. CHANGELOG.md bei jeder Änderung aktualisieren.

---

## Phase 1: Spendenbuch (Digitales Eingangsjournal)

### Hintergrund

Laut Dienstanweisung und Standardprozess führt Sandra Koll ein "Spendenbuch" als zentrales Register aller Spendeneingänge. Dieses wird bisher manuell gepflegt. Die SAC-Fragen II.1–II.6 (Aufnahme von Spenden) setzen eine lückenlose, chronologische Erfassung voraus.

### Prompt 1.1 – Schema-Erweiterung: Zugangsweg

```
Lies prisma/schema.prisma und lib/types.ts.

Erweitere das Zuwendung-Modell um ein neues Feld:

  zugangsweg  String?   // 'ueberweisung' | 'bar' | 'online' | 'paypal' | 'scheck' | 'sonstig'

Erstelle eine neue Prisma-Migration:
  npx prisma migrate dev --name add_zugangsweg

Aktualisiere lib/types.ts – füge zum Zuwendung-Interface hinzu:
  zugangsweg?: 'ueberweisung' | 'bar' | 'online' | 'paypal' | 'scheck' | 'sonstig' | null;

Aktualisiere app/api/zuwendungen/route.ts (POST):
  - body.zugangsweg in data aufnehmen

Aktualisiere components/ZuwendungFormular.tsx:
  - Neues Dropdown "Zugangsweg" nach dem Datum-Feld (nur bei art === 'geld'):
    Optionen: Überweisung, Bareinzahlung, Online-Spende, PayPal, Scheck, Sonstig
  - Das Feld ist optional, aber ein Hinweis erscheint wenn leer:
    "Für das Spendenbuch empfohlen: Bitte den Zugangsweg angeben."

Ergebnis: Zugangsweg erfassbar, in DB gespeichert, im Formular sichtbar.
Test: npm run build && tsc --noEmit
```

### Prompt 1.2 – Spendenbuch-Ansicht

```
Lies die Navigation in components/Navigation.tsx und die bestehende Zuwendungen-Seite.

Erstelle eine neue Seite app/spendenbuch/page.tsx und eine Komponente components/Spendenbuch.tsx.

Die Seite zeigt ein chronologisches Journal ALLER Zuwendungen – sortiert nach Eingangsdatum (neueste oben), NICHT nach Spender gruppiert.

Spalten der Tabelle:
- Lfd. Nr. (laufendeNr aus Zuwendung, falls vorhanden, sonst fortlaufende Zeilennummer)
- Datum (formatiert als dd.mm.yyyy)
- Spender (Anzeigename aus spender-Relation)
- Art (Geld / Sach – als farbiger Badge)
- Zugangsweg (Icon + Text, z.B. 🏦 Überweisung, 💵 Bar, 🌐 Online)
- Betrag (rechtsbündig, formatiert als Währung)
- Zweck / Bemerkung (aus bemerkung-Feld, gekürzt auf 50 Zeichen mit Tooltip)
- Status (✅ Quittiert / ⏳ Offen – basierend auf bestaetigungErstellt)

Filter oben:
- Jahr (Dropdown mit allen vorhandenen Jahren)
- Art (Alle / Geld / Sach)
- Zugangsweg (Alle / Überweisung / Bar / ...)
- Status (Alle / Offen / Quittiert)

Zusammenfassung am oberen Rand (in einer drk-card):
- Gesamtanzahl Zuwendungen (gefiltert)
- Gesamtsumme (gefiltert, formatiert als Währung)
- davon Geld / davon Sach (mit jeweiliger Summe)

Mobile: Cards statt Tabelle (wie SpenderTabelle.tsx als Referenz).

API: Nutze GET /api/zuwendungen mit den bestehenden Query-Parametern (jahr, art, status).
Erweitere die API um den zugangsweg-Filter:
  if (zugangsweg && zugangsweg !== 'alle') where.zugangsweg = zugangsweg;

Füge "Spendenbuch" als neuen Nav-Punkt in components/Navigation.tsx ein – zwischen "Zuwendungen" und "Bestätigung". Icon: ein Buch-SVG (Lucide-Style book-open).

Ergebnis: Vollständiges chronologisches Spendenjournal mit Filtern.
Test: npm run build && tsc --noEmit
```

---

## Phase 2: Sachspenden-Bewertungsdokumentation

### Hintergrund

Der Standardprozess zur Spendenabwicklung beschreibt einen ausführlichen Bewertungsprozess für Sachspenden: Kaufbelege einholen, Unterscheidung Betriebs- vs. Privatvermögen, eigene Wertermittlung mit Vergleichsrecherche, Dokumentation. Die DB hat bereits sachHerkunft, sachWertermittlung, sachKaufpreis – aber das Formular nutzt diese Felder nicht strukturiert genug für eine prüfungssichere Dokumentation.

### Prompt 2.1 – Erweiterte Sachspenden-Bewertung im Formular

```
Lies components/ZuwendungFormular.tsx und den Sachspenden-Bereich (ab Zeile 280).

Ersetze das einfache Textfeld "Unterlagen zur Wertermittlung" (sachWertermittlung) durch einen strukturierten Bewertungsblock. Dieser Block erscheint NUR bei art === 'sach'.

Neuer Bewertungsblock nach dem Herkunft-Radio-Button:

1. **Bewertungsgrundlage** (neues Feld sachBewertungsgrundlage in Schema + Types):
   Radio-Buttons:
   - "Originalrechnung / Kaufbeleg vorhanden"
   - "Eigene Wertermittlung (Vergleichsrecherche)"
   - "Gutachten / Sachverständiger"
   
2. **Bei "Eigene Wertermittlung"** → zusätzliche Felder einblenden:
   - Textarea "Bewertungsnotiz" (sachWertermittlung – bestehendes Feld, jetzt mit Placeholder: "z.B. Vergleich mit eBay-Kleinanzeigen-Inseraten vom 15.03.2026, Mittelwert aus 3 Angeboten: 250-320€")
   - Hinweis-Box (blau): "Dokumentieren Sie Ihre Recherche so, dass das Finanzamt die Wertfindung nachvollziehen kann. Screenshots von Vergleichsangeboten sollten der Akte beigelegt werden."

3. **Bei Betriebsvermögen** → bestehende Felder (Entnahmewert, Umsatzsteuer) bleiben.
   ZUSÄTZLICH: Roter Hinweis-Banner: "Bei Sachspenden aus dem Betriebsvermögen ist zwingend eine Rechnung des Spenders erforderlich."

4. **Wert-Plausibilitätsprüfung** (clientseitig):
   - Wenn sachKaufpreis > 0 und sachWert > sachKaufpreis: Gelbe Warnung "Der angesetzte Wert übersteigt den historischen Kaufpreis. Bitte prüfen."
   - Wenn sachWert > 5000: Gelbe Warnung "Bei Werten über 5.000 € empfiehlt sich die Einholung eines Sachverständigengutachtens."

Schema-Erweiterung (prisma/schema.prisma):
  sachBewertungsgrundlage  String?   // 'rechnung' | 'eigene_ermittlung' | 'gutachten'

Migration: npx prisma migrate dev --name add_sach_bewertungsgrundlage

Types (lib/types.ts): sachBewertungsgrundlage hinzufügen.
API (POST + PUT): sachBewertungsgrundlage aufnehmen.

Ergebnis: Strukturierte, prüfungssichere Sachspenden-Bewertung.
Test: npm run build && tsc --noEmit
```

---

## Phase 3: Zweckbindungs-Tracking

### Hintergrund

Die Dienstanweisung sagt: "Zweckgebundene Spenden dürfen nur für den vom Spender benannten Zweck eingesetzt werden." Der Standardprozess beschreibt die Zuordnung zu Kostenbereichen/Projekten. Die SAC-Fragen III.2 und III.3 prüfen die dokumentierte Sicherstellung der zweckgebundenen Verwendung. Aktuell gibt es nur ein optionales Bemerkungsfeld – keine strukturierte Zweckbindung.

### Prompt 3.1 – Schema + Formular: Zweckbindung

```
Lies prisma/schema.prisma und components/ZuwendungFormular.tsx.

Schema-Erweiterung (Zuwendung-Modell):
  zweckgebunden          Boolean   @default(false)
  zweckbindung           String?   // Freitext: "Jugendarbeit", "Katastrophenhilfe" etc.
  zweckVerwendet         Boolean   @default(false)
  zweckVerwendetDatum    DateTime?
  zweckVerwendetNotiz    String?   // z.B. "Eingesetzt für Anschaffung Zelt Bereitschaft Würselen"

Migration: npx prisma migrate dev --name add_zweckbindung

Types (lib/types.ts): Alle 5 Felder hinzufügen.
API (POST + PUT): Alle Felder aufnehmen.

Formular (ZuwendungFormular.tsx):
- Nach dem bestehenden Bemerkungsfeld:
  Checkbox: "Diese Zuwendung ist zweckgebunden"
  Wenn aktiviert → Textfeld "Zweckbindung" erscheint (Pflicht wenn zweckgebunden=true).
  Placeholder: "z.B. für die Jugendarbeit, Katastrophenhilfe, Kleiderkammer..."

Ergebnis: Zweckbindung erfassbar bei jeder Zuwendung.
Test: npm run build && tsc --noEmit
```

### Prompt 3.2 – Zweckbindungs-Übersicht im Dashboard

```
Lies app/page.tsx (Dashboard) und components/StatistikKarten.tsx.

Erstelle eine neue Komponente components/ZweckbindungsStatus.tsx:

Die Komponente zeigt eine Übersicht aller offenen zweckgebundenen Zuwendungen:
- Nur Zuwendungen mit zweckgebunden === true und zweckVerwendet === false
- Jede Zeile: Datum, Spender, Betrag, Zweckbindung-Text, Alter (in Tagen/Monaten)
- Farbcodierung:
  - Grün: < 12 Monate alt
  - Gelb: 12-18 Monate alt
  - Rot: > 18 Monate alt (nähert sich der 2-Jahres-Frist)
- Button "Als verwendet markieren" pro Zeile → öffnet Mini-Dialog:
  - Datum der Verwendung (date-Input, default: heute)
  - Verwendungsnotiz (Freitext, Pflicht)
  - Speichern → PATCH /api/zuwendungen/[id] mit zweckVerwendet=true, zweckVerwendetDatum, zweckVerwendetNotiz

API-Erweiterung – GET /api/zuwendungen:
  Neuer Filter: status=zweckgebunden_offen → where: { zweckgebunden: true, zweckVerwendet: false }

Dashboard (app/page.tsx):
  Binde ZweckbindungsStatus als neue Karte ein, NACH den StatistikKarten, VOR dem Schnellzugriff.
  Zeige die Komponente NUR wenn es offene zweckgebundene Zuwendungen gibt.
  Titel: "Offene Zweckbindungen" mit Anzahl-Badge.

Ergebnis: Zweckgebundene Spenden sind sofort sichtbar und können als verwendet markiert werden.
Test: npm run build && tsc --noEmit
```

---

## Phase 4: Fristüberwachung (Zwei-Jahres-Regel nach § 55 AO)

### Hintergrund

Die SAC-Frage III.4 war der einzige Punkt im Spendenmanagement, der nicht glatt mit "Ja" beantwortet wurde (ursprünglich "Teilweise", dann von KPMG korrigiert). Die Dienstanweisung verweist auf § 55 Abs. 1 Nr. 5 AO: zeitnahe Verwendung innerhalb von zwei Kalender- oder Wirtschaftsjahren. Dieses Feature stellt sicher, dass diese Schwachstelle künftig technisch abgesichert ist.

### Prompt 4.1 – Fristüberwachung-Komponente

```
Lies app/page.tsx (Dashboard), components/StatistikKarten.tsx und lib/freistellung-check.ts (als Pattern-Referenz).

Erstelle eine neue Komponente components/Fristwarnung.tsx:

Die Komponente prüft ALLE Zuwendungen und identifiziert solche, deren Verausgabungsfrist sich dem Ende nähert.

Logik:
- Frist = 2 Kalenderjahre nach Zufluss (datum der Zuwendung)
- Beispiel: Spende eingegangen 15.03.2024 → Frist endet 31.12.2026
- Die Frist bezieht sich auf Kalenderjahre, nicht auf 24 Monate exakt
- Berechnung: fristEnde = new Date(zuwendung.datum).getFullYear() + 2, dann 31.12. dieses Jahres

Ampel-Status pro Zuwendung:
- 🟢 Grün: Frist > 6 Monate entfernt → nicht anzeigen
- 🟡 Gelb: Frist in 3–6 Monaten → "Verausgabung empfohlen"
- 🟠 Orange: Frist in < 3 Monaten → "Verausgabung dringend"
- 🔴 Rot: Frist überschritten → "Frist überschritten – bitte sofort prüfen"

Darstellung:
- Nur Zuwendungen mit Status Gelb, Orange oder Rot anzeigen
- Gruppiert nach Ampel-Status (Rot oben, dann Orange, dann Gelb)
- Jede Zeile: Spender, Betrag, Eingangsdatum, Frist-Ende, Ampel-Badge
- Hinweis-Box am unteren Rand: "Gemäß § 55 Abs. 1 Nr. 5 AO müssen Spendenmittel zeitnah – in der Regel innerhalb von zwei Kalender- oder Wirtschaftsjahren nach Zufluss – verwendet werden."

NICHT anzeigen für:
- Zuwendungen die bereits als zweckVerwendet markiert sind (aus Phase 3)
- Zuwendungen bei denen bestaetigungErstellt === true UND der Betrag <= 300€ (vereinfachter Nachweis)

Dashboard-Integration (app/page.tsx):
- Fristwarnung als eigene Karte einfügen, NACH ZweckbindungsStatus (Phase 3), VOR Schnellzugriff
- NUR anzeigen wenn Warnungen vorhanden sind
- Titel: "⏰ Verausgabungsfristen" mit Anzahl-Badge (rot wenn Fristüberschreitungen)

Ergebnis: Automatische Fristüberwachung auf dem Dashboard, die genau die KPMG-Feststellung adressiert.
Test: npm run build && tsc --noEmit
```

---

## Phase 5: Empfangsbestätigung für Sachspenden (DOCX)

### Hintergrund

Der Standardprozess beschreibt: "Es wird ein einfaches Übergabeprotokoll oder Empfangsbestätigung erstellt, in dem Datum, Spendername, Beschreibung der Gegenstände und empfangende Stelle/Mitarbeiter festgehalten sind." Dieses Dokument muss "vom Spender und vom Empfänger unterzeichnet werden" und dient dem Nachweis des Eigentumsübergangs. Die App generiert bisher nur BMF-Zuwendungsbestätigungen, aber kein internes Übergabeprotokoll.

### Prompt 5.1 – Empfangsbestätigungs-Template

```
Lies lib/docx-templates/shared.ts und lib/docx-templates/sachzuwendung.ts als Referenz für das DOCX-Pattern.

Erstelle eine neue Datei lib/docx-templates/empfangsbestaetigung.ts.

Diese generiert ein internes Übergabeprotokoll (KEIN BMF-Muster, sondern ein DRK-internes Dokument).

Inhalt des DOCX:

KOPFBEREICH:
- DRK-Logo (aus verein.logoBase64 oder Default-Logo)
- "Empfangsbestätigung / Übergabeprotokoll Sachspende"
- "DRK Kreisverband [Vereinsname]"
- "Internes Dokument – Nicht zur Vorlage beim Finanzamt"

ABSCHNITT 1 – Spenderdaten:
- Name/Firma des Spenders (aus spender-Relation)
- Adresse des Spenders

ABSCHNITT 2 – Gegenstand der Sachspende:
- Bezeichnung (sachBezeichnung)
- Alter/Zustand (sachAlter, sachZustand)
- Anzahl: 1 (oder Freitext wenn erweitert)
- Geschätzter Wert: [sachWert] € (falls vorhanden)
- Herkunft: Privatvermögen / Betriebsvermögen
- Bewertungsgrundlage: Rechnung / Eigene Ermittlung / Gutachten (sachBewertungsgrundlage aus Phase 2)

ABSCHNITT 3 – Übernahme:
- Datum der Übernahme: [datum der Zuwendung]
- Empfangende Stelle: [Vereinsname]
- Empfangende Person: __________________ (Freitext-Linie für handschriftliche Eintragung)
- Geplante Verwendung: [bemerkung oder zweckbindung, falls vorhanden]

ABSCHNITT 4 – Unterschriften:
- Zwei Unterschrifts-Blöcke nebeneinander:
  Links: "Spender/in" mit Linie + "Ort, Datum" darunter
  Rechts: "Empfänger/in (DRK)" mit Linie + "Ort, Datum" darunter

FUSSZEILE:
- "Dieses Dokument dient der internen Dokumentation des Eigentumsübergangs."
- "[Vereinsname] · [Adresse]"

Die Funktion bekommt als Parameter: verein: Verein, zuwendung: Zuwendung (mit spender-Relation).
Export: export async function erstelleEmpfangsbestaetigung(verein, zuwendung): Promise<Blob>

Styling: Wie die anderen Templates – Arial, saubere Struktur, Tabellen für Datenfelder.

Ergebnis: DOCX-Template für Empfangsbestätigungen fertig.
Test: npm run build && tsc --noEmit
```

### Prompt 5.2 – Download-Button in der UI

```
Lies components/ZuwendungTabelle.tsx und app/zuwendungen/page.tsx.

Füge in der ZuwendungTabelle für jede Sachspende einen zusätzlichen Button "📋 Empfangsbestätigung" hinzu.
Position: neben dem bestehenden Bestätigungs-Button (oder im Dropdown/Menü der Zeile).

Der Button ist NUR sichtbar bei art === 'sach'.

Beim Klick:
1. Lade die vollständigen Zuwendungsdaten inkl. Spender (GET /api/zuwendungen/[id] mit include spender)
2. Lade die Vereinsdaten (aus useAuth / kreisverband)
3. Rufe erstelleEmpfangsbestaetigung(verein, zuwendung) auf
4. Triggere den Download als "Empfangsbestaetigung_[Spendername]_[Datum].docx"

Ebenfalls im Batch-Export (app/export/page.tsx):
- Wenn Sachspenden im Export enthalten sind, eine zusätzliche Checkbox anbieten:
  "Empfangsbestätigungen für Sachspenden mit exportieren"
- Wenn aktiviert: Für jede Sachspende das Übergabeprotokoll in den ZIP-Export einschließen (in einem Unterordner "Empfangsbestaetigungen/")

Ergebnis: Empfangsbestätigungen einzeln und im Batch herunterladbar.
Test: npm run build && tsc --noEmit
```

---

## Abschluss: Prüfung und Dokumentation

```
Führe folgende Prüfungen durch:

1. npm run build && tsc --noEmit → muss fehlerfrei sein
2. Prüfe alle neuen API-Endpunkte auf Mandantenisolation (kreisverbandId aus Session)
3. Prüfe dass die Navigation vollständig ist und "Spendenbuch" korrekt verlinkt ist
4. Prüfe dass alle neuen Felder in der DOCX-Generierung korrekt sind

Aktualisiere CHANGELOG.md mit allen Änderungen unter ## [Unreleased]:

### Added
- Spendenbuch: Chronologisches Journal aller Zuwendungen mit Filtern (SAC II.1–II.6)
- Zugangsweg-Erfassung bei Geldzuwendungen (Überweisung, Bar, Online, PayPal, Scheck)
- Sachspenden-Bewertungsdokumentation: Strukturierte Erfassung der Bewertungsgrundlage und Plausibilitätsprüfung (SAC IV.3)
- Zweckbindungs-Tracking: Erfassung, Übersicht offener Zweckbindungen, Markierung als verwendet (SAC III.2, III.3)
- Fristüberwachung: Automatische Ampel für die Zwei-Jahres-Verausgabungsfrist nach § 55 Abs. 1 Nr. 5 AO (SAC III.4)
- Empfangsbestätigung: DOCX-Übergabeprotokoll für Sachspenden (Standardprozess Spendenabwicklung)

### Changed
- ZuwendungFormular: Erweiterte Sachspenden-Felder mit Bewertungsblock
- Dashboard: Neue Karten für Zweckbindungen und Fristwarnungen
- Navigation: Neuer Menüpunkt "Spendenbuch"
- Batch-Export: Optionaler Export von Empfangsbestätigungen für Sachspenden

Aktualisiere lib/version.ts auf die nächste Minor-Version.

Ergebnis: Alle SAC-Verbesserungen implementiert und dokumentiert.
```
