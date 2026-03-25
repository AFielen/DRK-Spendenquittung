---
title: Prisma Migrations sicher durchführen
impact: HIGH
tags: prisma, migrations, prisma-migrate, deployment
---

## Prisma Migrations sicher durchführen

Migrations sind die riskanteste DB-Operation. Klare Regeln verhindern Datenverlust.

**prisma.config.ts / schema.prisma:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Workflow:**

```bash
# 1. Schema ändern (schema.prisma editieren)
# 2. Migration generieren und anwenden (Development)
npx prisma migrate dev --name beschreibung_der_aenderung

# 3. Migration prüfen (IMMER manuell lesen!)
cat prisma/migrations/YYYYMMDDHHMMSS_beschreibung/migration.sql

# 4. Migration in Produktion anwenden
npx prisma migrate deploy

# Entwicklung: Schema direkt pushen ohne Migration-Dateien
npx prisma db push
```

**Gefährliche Migrations vermeiden:**

```sql
-- FALSCH: Sperrt die ganze Tabelle bei großen Daten
CREATE INDEX orders_status_idx ON orders (status);

-- RICHTIG: Non-blocking Index-Erstellung
CREATE INDEX CONCURRENTLY orders_status_idx ON orders (status);
```

```sql
-- FALSCH: Column mit NOT NULL + DEFAULT auf großer Tabelle (vor PG 11 problematisch)
ALTER TABLE orders ADD COLUMN priority int NOT NULL DEFAULT 0;

-- RICHTIG (bei PG 16 kein Problem mehr, aber bewusst prüfen):
-- PostgreSQL 11+ setzt DEFAULT ohne Table-Rewrite
ALTER TABLE orders ADD COLUMN priority int NOT NULL DEFAULT 0;
```

**Rollback-Strategie:**

- Prisma hat kein automatisches Rollback
- Manuell: Für jede Migration ein Rollback-SQL vorbereiten
- Vor kritischen Migrations: `pg_dump` Backup erstellen
- `npx prisma migrate resolve` zum Markieren fehlgeschlagener Migrations

```bash
# Backup vor Migration
docker exec drk-db pg_dump -U drk appname > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Wichtig:** Migration-Dateien werden in Git committet. Niemals generierte Migrations manuell editieren — stattdessen neue Migration generieren.

**Prisma Client nach Schema-Änderung regenerieren:**

```bash
npx prisma generate
```

Reference: [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate)
