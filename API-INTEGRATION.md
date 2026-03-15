# REST-API (v1)

Die DRK-Spendenquittung bietet eine öffentliche REST-API für die Integration mit externen Anwendungen und KI-Agenten.

## Authentifizierung

Alle API-Anfragen erfordern einen API-Schlüssel als Bearer-Token:

```bash
curl -H "Authorization: Bearer sq_live_abc123..." \
  https://ihre-domain.de/api/v1/spender
```

API-Schlüssel werden in der Web-App unter `/api-schluessel` von Administratoren und Schatzmeistern erstellt.

## Basis-URL

```
https://ihre-domain.de/api/v1/
```

## Rate Limiting

- **100 Anfragen pro Minute** pro API-Schlüssel
- Response-Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Bei Überschreitung: HTTP 429

## Berechtigungen (Scopes)

| Scope | Beschreibung |
|---|---|
| `spender:read` | Spender auflisten und anzeigen |
| `spender:write` | Spender erstellen, bearbeiten, löschen |
| `zuwendungen:read` | Zuwendungen auflisten und anzeigen |
| `zuwendungen:write` | Zuwendungen erstellen, bearbeiten, löschen |
| `kreisverband:read` | Vereinsdaten anzeigen |

## Endpunkte

### Spender

| Methode | Pfad | Scope | Beschreibung |
|---|---|---|---|
| `GET` | `/api/v1/spender` | `spender:read` | Alle Spender auflisten |
| `POST` | `/api/v1/spender` | `spender:write` | Neuen Spender erstellen |
| `GET` | `/api/v1/spender/{id}` | `spender:read` | Spender mit Zuwendungen abrufen |
| `PUT` | `/api/v1/spender/{id}` | `spender:write` | Spender aktualisieren |
| `DELETE` | `/api/v1/spender/{id}` | `spender:write` | Spender löschen (`?confirm=true` bei vorhandenen Zuwendungen) |

**POST/PUT Body (Person):**
```json
{
  "istFirma": false,
  "vorname": "Max",
  "nachname": "Mustermann",
  "strasse": "Musterstr. 1",
  "plz": "52062",
  "ort": "Aachen",
  "anrede": "Herr",
  "steuerIdNr": "12345678901"
}
```

**POST/PUT Body (Firma):**
```json
{
  "istFirma": true,
  "firmenname": "Musterfirma GmbH",
  "strasse": "Musterstr. 1",
  "plz": "52062",
  "ort": "Aachen"
}
```

### Zuwendungen

| Methode | Pfad | Scope | Beschreibung |
|---|---|---|---|
| `GET` | `/api/v1/zuwendungen` | `zuwendungen:read` | Alle Zuwendungen auflisten (mit Filtern) |
| `POST` | `/api/v1/zuwendungen` | `zuwendungen:write` | Neue Zuwendung erstellen |
| `GET` | `/api/v1/zuwendungen/{id}` | `zuwendungen:read` | Zuwendung mit Spender-Details |
| `PUT` | `/api/v1/zuwendungen/{id}` | `zuwendungen:write` | Zuwendung aktualisieren (nicht wenn bestätigt) |
| `DELETE` | `/api/v1/zuwendungen/{id}` | `zuwendungen:write` | Zuwendung löschen (nicht wenn bestätigt) |

**GET Query-Parameter:**

| Parameter | Beschreibung |
|---|---|
| `spenderId` | Nach Spender filtern |
| `jahr` | Nach Jahr filtern (z.B. `2026`) |
| `art` | `geld` oder `sach` |
| `status` | `offen`, `bestaetigt` oder `zweckgebunden_offen` |
| `zugangsweg` | `ueberweisung`, `bar`, `online`, `lastschrift`, `paypal`, `scheck`, `sonstig` |

**POST Body (Geldspende):**
```json
{
  "spenderId": "uuid",
  "art": "geld",
  "verwendung": "spende",
  "betrag": 100.00,
  "datum": "2026-03-15",
  "zugangsweg": "ueberweisung",
  "verzicht": false,
  "bemerkung": "Optionale Notiz"
}
```

### Kreisverband

| Methode | Pfad | Scope | Beschreibung |
|---|---|---|---|
| `GET` | `/api/v1/kreisverband` | `kreisverband:read` | Vereinsdaten abrufen (ohne Logo) |

## Nicht über die API verfügbar

Folgende Funktionen sind nur in der Web-App verfügbar:

- PDF-/DOCX-Erstellung (Zuwendungsbestätigungen)
- Zuwendungen bestätigen (laufende Nummer vergeben)
- Batch-Export (ZIP-Download)
- Vereinsdaten bearbeiten
- Nutzerverwaltung

## Fehlerformat

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Ungültiger oder fehlender API-Schlüssel."
  }
}
```

| Status | Code | Beschreibung |
|---|---|---|
| 400 | `VALIDATION` | Ungültige Eingabedaten |
| 401 | `UNAUTHORIZED` | Fehlender/ungültiger API-Schlüssel |
| 403 | `FORBIDDEN` | Fehlende Berechtigung |
| 404 | `NOT_FOUND` | Ressource nicht gefunden |
| 409 | `CONFLICT` | Konflikt (z.B. bestätigte Zuwendung) |
| 429 | `RATE_LIMITED` | Zu viele Anfragen |
