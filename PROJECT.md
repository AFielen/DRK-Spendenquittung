# PROJECT.md – Interne Projektdokumentation

## App-Name
DRK Spendenquittung

## Zweck
Zuwendungsbestätigungen nach BMF-Muster für DRK-Verbände erstellen, verwalten und als PDF/DOCX exportieren. Mandantenfähig mit Magic-Link-Auth und REST-API.

## Status
🟡 In Entwicklung

## Zielgruppe
- Alle DRK-Kreisverbände bundesweit
- Schatzmeister und Verwaltungskräfte, die Spendenquittungen ausstellen

## Architektur-Entscheidungen
- **Server-Variante (Variante B)** – API-Routes, DB, Auth, PDF-Generierung erfordern Backend
- **PostgreSQL via Prisma ORM** – Mandantenisolation über `kreisverbandId`
- **iron-session** – HttpOnly Session-Cookies, kein externer Auth-Provider
- **Magic-Link Auth** – SHA-256 gehashte Codes, kein Passwort-Management nötig
- **Docker-Deployment** auf Hetzner Cloud (DSGVO-konform, EU-only)
- **pdfmake + docx** – Server-seitige Dokumentgenerierung nach BMF-Muster

## Offene Punkte
- [ ] i18n (DE/EN) durchgängig implementieren oder bewusst weglassen
- [ ] E2E-Tests einrichten
- [ ] Logo-Upload Größenlimitierung

## Changelog
Siehe `CHANGELOG.md`
