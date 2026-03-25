---
name: coding-presets
description: >
  Kontextabhängige Coding-Anweisungen für Bug-Fixes, Features, Reviews, Refactoring,
  Sicherheits-Audits und Architektur-Analysen. Enthält den Workflow-Entscheidungsbaum
  (Bug → Plan, Feature klein → Plan, Feature groß → Roadmap → Plan) und generiert
  passende Prompts für Claude Code und Perplexity Computer. Nutze diesen Skill wenn ein
  Ticket bearbeitet, ein PR erstellt, Code geprüft oder ein Feature geplant werden soll.
metadata:
  author: axel-fielen
  version: '1.0'
  stack: Next.js, React, TypeScript, Tailwind, Prisma ORM, PostgreSQL
---

# Coding Presets

Kontextabhängige Prompt-Vorlagen und Workflow-Steuerung für die Softwareentwicklung.
Dieser Skill wird geladen, wenn ein Ticket bearbeitet, Code geprüft oder ein Feature
geplant werden soll — lokal in Claude Code oder delegiert über Perplexity Computer.

## Workflow-Entscheidungsbaum

Bestimme zuerst den **Typ und die Größe** der Aufgabe. Daraus ergibt sich der Workflow:

```
┌─────────────────────────────────────────────────────────┐
│                    Neue Aufgabe                         │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Bugfix    Feature    Wartung
              │          │          │
              │    ┌─────┴─────┐   │
              │    ▼           ▼   │
              │  Klein       Groß  │
              │    │           │   │
              ▼    ▼           │   ▼
         ┌────────────┐       │  ┌────────────┐
         │ Plan-Modus │       │  │ Plan-Modus │
         │  (direkt)  │       │  │  (direkt)  │
         └────────────┘       │  └────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Roadmap zuerst  │
                    │ (Claude Chat /   │
                    │  Computer)       │
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │  Plan-Modus mit  │
                    │  Roadmap-Output  │
                    └──────────────────┘
```

### Entscheidungskriterien

| Kriterium | Bugfix | Feature (klein) | Feature (groß) | Wartung |
|-----------|--------|-----------------|-----------------|---------|
| Dateien betroffen | 1–3 | 1–5 | 5+ oder neues Modul | variabel |
| Neue DB-Tabellen | Nein | Selten | Ja | Nein |
| API-Endpunkte neu | Nein | 0–1 | 2+ | Nein |
| Workflow | Direkt → Plan | Direkt → Plan | Roadmap → Plan | Direkt → Plan |
| Beispiel | Login-Redirect kaputt | Filter-Dropdown hinzufügen | Agent-System mit MCP | Dependencies updaten |

---

## Preset-Kategorien

Jeder Preset besteht aus:
- **Wann nutzen**: Trigger-Kriterien
- **Template**: Kopierbare Prompt-Vorlage mit Platzhaltern
- **Hinweise**: Tipps für optimale Ergebnisse

Die Platzhalter verwenden die Syntax `{PLATZHALTER}`. Ersetze sie mit den konkreten Werten.

---

### 1. Bugfix

**Wann nutzen:** Fehlermeldung, unerwartetes Verhalten, Regression nach einem Deployment.

**Template:**
```
In {REPO_URL} gibt es einen Bug:

Fehlerbeschreibung: {BESCHREIBUNG}
Fehlermeldung: {FEHLERMELDUNG}
Schritte zum Reproduzieren:
1. {SCHRITT_1}
2. {SCHRITT_2}
3. {SCHRITT_3}

Erwartetes Verhalten: {ERWARTET}
Tatsächliches Verhalten: {TATSÄCHLICH}

Betroffene Bereiche (falls bekannt): {DATEIEN_ODER_MODULE}

Finde die Ursache, fixe den Bug und erstelle einen PR.
Stelle sicher, dass ein Test den Fix absichert.
```

**Hinweise:**
- Je präziser die Fehlermeldung und Reproduktionsschritte, desto schneller der Fix
- Stack-Traces und Browser-Console-Logs immer mitgeben
- Bei Regressionen den letzten funktionierenden Commit/PR nennen

---

### 2. Feature (klein)

**Wann nutzen:** Überschaubares Feature, wenige Dateien betroffen, kein neues Datenmodell.

**Template:**
```
Implementiere in {REPO_URL} folgendes Feature:

Feature: {FEATURE_TITEL}
Beschreibung: {WAS_SOLL_ES_TUN}

Anforderungen:
- {ANFORDERUNG_1}
- {ANFORDERUNG_2}
- {ANFORDERUNG_3}

UI-Änderungen: {JA_NEIN_DETAILS}
API-Änderungen: {JA_NEIN_DETAILS}
Datenbank-Änderungen: {JA_NEIN_DETAILS}

Erstelle einen PR auf einem Feature-Branch.
Schreibe Tests für die neue Funktionalität.
```

**Hinweise:**
- Scope klar eingrenzen — lieber ein PR pro Feature als ein Monster-PR
- Existierende Patterns im Repo beachten (der Agent liest die CLAUDE.md automatisch)

---

### 3. Feature (groß) — Roadmap-Phase

**Wann nutzen:** Komplexes Feature mit mehreren Modulen, neuen DB-Tabellen, mehreren API-Endpunkten.
Dieser Prompt geht zuerst an Claude Chat oder Perplexity Computer für die Planung.

**Template (Roadmap-Erstellung):**
```
Ich plane ein neues Feature für {REPO_URL}:

Feature: {FEATURE_TITEL}
Ziel: {ÜBERGEORDNETES_ZIEL}

Kontext:
- Stack: {STACK_BESCHREIBUNG}
- Aktueller Stand: {WAS_EXISTIERT_BEREITS}
- Abhängigkeiten: {EXTERNE_SERVICES_ODER_LIBS}

Anforderungen:
- {ANFORDERUNG_1}
- {ANFORDERUNG_2}
- {ANFORDERUNG_3}

Erstelle eine detaillierte Roadmap mit:
1. Phasen und Meilensteinen
2. Technischen Entscheidungen (Architektur, Datenmodell, API-Design)
3. Reihenfolge der Implementierung (was zuerst, was hängt voneinander ab)
4. Risiken und offene Fragen
5. Geschätzter Aufwand pro Phase

Formuliere am Ende für jede Phase eine konkrete Claude-Code-Anweisung,
die ich direkt im Plan-Modus verwenden kann.
```

**Template (Umsetzung nach Roadmap):**
```
Setze Phase {PHASE_NR} der Roadmap um in {REPO_URL}:

Roadmap-Kontext:
{ROADMAP_AUSZUG_FÜR_DIESE_PHASE}

Konkrete Aufgaben dieser Phase:
- {AUFGABE_1}
- {AUFGABE_2}
- {AUFGABE_3}

Voraussetzungen aus vorherigen Phasen:
- {WAS_BEREITS_EXISTIERT}

Erstelle einen PR auf dem Branch feature/{FEATURE_NAME}.
```

**Hinweise:**
- Roadmap immer als Markdown speichern (z.B. in docs/roadmaps/)
- Jede Phase sollte ein eigenständiger, deploybare PR sein
- Bei Abhängigkeiten zwischen Phasen: vorherigen PR zuerst mergen

---

### 4. Code-Review

**Wann nutzen:** PR liegt vor und soll geprüft werden.

**Template:**
```
Reviewe diesen PR: {PR_URL}

Fokus:
- {FOKUS_BEREICH_1}
- {FOKUS_BEREICH_2}

Kontext: {WARUM_DIESER_PR_WICHTIG_IST}

Poste die Findings als Inline-Kommentare auf dem PR.
```

**Hinweise:**
- Der `code-review` Skill wird automatisch geladen
- Bei Perplexity Computer werden zwei parallele Reviewer gestartet
- Fokus-Bereiche helfen dem Reviewer, die wichtigen Stellen zu finden

---

### 5. Refactoring

**Wann nutzen:** Bestehender Code soll umstrukturiert werden ohne Verhaltensänderung.

**Template:**
```
Refactore in {REPO_URL} den Bereich {BEREICH}:

Aktuelles Problem:
- {PROBLEM_1}
- {PROBLEM_2}

Gewünschtes Ergebnis:
- {ZIEL_1}
- {ZIEL_2}

Scope: {WELCHE_DATEIEN_ORDNER}

Regeln:
- Kein Verhaltensänderung — nur Struktur
- Bestehende Tests müssen weiterhin grün sein
- Neue Tests wo sinnvoll

Erstelle einen PR mit den Änderungen.
```

---

### 6. Sicherheits-Audit

**Wann nutzen:** Vor einem Release, nach einem Sicherheitsvorfall, oder regelmäßig.

**Template:**
```
Führe ein Sicherheits-Audit durch für {REPO_URL}.

Prüfe besonders:
- Authentifizierung und Autorisierung (JWT/Session-Handling)
- SQL-Injection und andere Injection-Angriffe
- XSS-Schwachstellen
- CORS-Konfiguration
- Umgang mit Secrets und Umgebungsvariablen
- Dependency-Schwachstellen (package.json / package-lock.json)
- Rate Limiting und Input-Validierung
- CSRF-Schutz

Kontext: {DEPLOYMENT_UMGEBUNG_UND_NUTZERKREIS}

Ergebnis als Liste sortiert nach Schweregrad (kritisch → niedrig).
Für jedes Finding: Beschreibung, betroffene Datei/Zeile, Empfehlung.
```

---

### 7. Architektur-Review

**Wann nutzen:** Grundsätzliche Bewertung der Projektstruktur, vor größeren Umbauarbeiten.

**Template:**
```
Analysiere die Architektur von {REPO_URL}.

Bewerte:
- Ordnerstruktur und Projektorganisation
- Trennung von Concerns (Frontend/Backend/DB)
- API-Design und Routing-Struktur
- Datenbank-Schema und Relationen
- Skalierbarkeit der aktuellen Architektur
- Docker-Setup und Deployment-Konfiguration

Kontext:
- {WAS_MACHT_DIE_APP}
- {AKTUELLER_STAND}
- {GEPLANTE_ERWEITERUNGEN}

Gib konkrete Empfehlungen, was umstrukturiert werden sollte.
Priorisiere nach Aufwand/Nutzen-Verhältnis.
```

---

### 8. Performance-Analyse

**Wann nutzen:** App ist langsam, vor einem Scaling-Schritt, oder als regelmäßiger Check.

**Template:**
```
Analysiere die Performance von {REPO_URL}.

Fokus:
- Unnötige Re-Renders in React-Komponenten
- Datenbankabfragen optimieren (N+1 Queries, fehlende Indizes)
- Bundle-Size und Code-Splitting
- API-Response-Zeiten und Caching-Strategien
- Lazy Loading von Komponenten und Routen

Kontext: {WELCHE_BEREICHE_SIND_LANGSAM}

Für jedes Finding: Beschreibung, Messung/Schätzung, konkreter Fix.
```

---

### 9. Test-Abdeckung

**Wann nutzen:** Tests fehlen, Test-Coverage soll verbessert werden.

**Template:**
```
Prüfe die Test-Abdeckung in {REPO_URL}.

- Welche Bereiche haben keine Tests?
- Welche kritischen Pfade sind ungetestet?
- Schreibe fehlende Unit-Tests für: {PRIORITÄTS_BEREICHE}
- Schreibe Integration-Tests für die API-Endpunkte

Erstelle einen PR mit den neuen Tests.
Bestehende Tests dürfen nicht brechen.
```

---

### 10. Dependency-Update

**Wann nutzen:** Regelmäßige Wartung, Sicherheitswarnung, Major-Version-Upgrade.

**Template:**
```
Prüfe in {REPO_URL} alle Dependencies:

- Welche Pakete sind veraltet?
- Welche haben bekannte Sicherheitslücken?
- Aktualisiere alle sicheren Updates und erstelle einen PR
- Liste Breaking Changes separat auf, die manuelles Eingreifen brauchen

Bei Major-Updates: Prüfe die Migration-Guides und dokumentiere
notwendige Code-Änderungen.
```

---

### 11. Pre-Release-Check

**Wann nutzen:** Vor einem Deployment in Produktion.

**Template:**
```
{REPO_URL} geht in Produktion.
Mach einen Pre-Release-Check:

- Sicherheits-Audit (kritische Schwachstellen)
- Performance-Check (offensichtliche Bottlenecks)
- Fehlendes Error-Handling
- Docker/Deployment-Config prüfen
- Hardgecodete Dev-Werte finden
- Umgebungsvariablen vollständig dokumentiert?
- Logging und Monitoring vorbereitet?
- DSGVO-Konformität (Datenschutz-Basics)

Kontext: Deployed via Docker Compose auf {SERVER}.
Nutzerkreis: {WER_NUTZT_DIE_APP}
```

---

### 12. Dokumentation erstellen

**Wann nutzen:** Neuer Entwickler soll einsteigen, oder Projekt braucht Doku.

**Template:**
```
Erstelle für {REPO_URL} eine Entwickler-Dokumentation:

- Architektur-Übersicht
- Setup-Anleitung (Docker + lokal)
- API-Dokumentation aller Endpunkte
- Datenbank-Schema Beschreibung
- Coding Conventions und Patterns
- Deployment-Prozess

Speichere als {ZIELDATEI} im Repo und erstelle einen PR.
```

---

## Nutzung durch Perplexity Computer

Wenn dieser Skill über Perplexity Computer genutzt wird (statt lokal in Claude Code):

1. **Computer** liest den Ticket-Typ und die Beschreibung
2. **Computer** wählt den passenden Preset aus diesem Skill
3. **Computer** füllt die Platzhalter mit den Ticket-Informationen
4. **Computer** delegiert den ausgefüllten Prompt an einen Code-Subagenten
5. Der Subagent arbeitet autonom und erstellt einen PR

### Beispiel: Computer bekommt "Fix den Login-Bug in Dash"

→ Computer erkennt: **Bugfix**
→ Computer wählt: Preset #1 (Bugfix)
→ Computer generiert:

```
In https://github.com/AFielen/Dash gibt es einen Bug:

Fehlerbeschreibung: Login funktioniert nicht
Schritte zum Reproduzieren: [fragt ggf. nach oder recherchiert in Issues]
...
Finde die Ursache, fixe den Bug und erstelle einen PR.
```

→ Computer delegiert an Code-Subagent mit `coding-workflow` Skill

### Beispiel: Computer bekommt "Implementiere ein Agent-Dashboard in Dash"

→ Computer erkennt: **Feature (groß)** — neues Modul, mehrere Komponenten
→ Computer wählt: Preset #3 (Feature groß — Roadmap-Phase)
→ Computer erstellt zuerst eine Roadmap
→ Danach delegiert Computer Phase für Phase an Code-Subagenten

---

## Anpassung der Presets

Die Presets sind Ausgangspunkte. Du kannst sie ergänzen:

- **Scope eingrenzen:** "Prüfe nur die API-Routen in server/routes/"
- **Ergebnis-Format:** "Nur Analyse" / "PR mit Fixes" / "Markdown-Dokument"
- **Mehrere Repos vergleichen:** "Vergleiche Patterns aus Repo A und Repo B"
- **Iterativ arbeiten:** Erst Review, dann "Behebe Problem #1, #3 und #5"
