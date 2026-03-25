---
title: Prisma Schema-Patterns für DRK-Apps
impact: CRITICAL
tags: prisma, schema, typescript, patterns
---

## Prisma Schema-Patterns für DRK-Apps

Standardisierte Schema-Definitionen für alle DRK Variante-B Apps.

**Wiederverwendbare Basis-Felder (als Abstract Model):**

```prisma
// Timestamps für jede Tabelle — als Felder in jedem Model wiederholen
// createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
// updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

// Soft-Delete (optional)
// deletedAt DateTime? @map("deleted_at") @db.Timestamptz

// Multi-Tenant (Pflicht für alle Tenant-Tabellen)
// tenantId BigInt @map("tenant_id")
```

**Standard-Model (Multi-Tenant):**

```prisma
model Document {
  id        BigInt   @id @default(autoincrement())
  tenantId  BigInt   @map("tenant_id")
  title     String
  content   String?
  createdBy BigInt   @map("created_by")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  tenant  Tenant @relation(fields: [tenantId], references: [id])
  creator User   @relation(fields: [createdBy], references: [id])

  @@index([tenantId])
  @@index([createdBy])
  @@map("documents")
}
```

**Relations definieren:**

```prisma
model Tenant {
  id        BigInt     @id @default(autoincrement())
  name      String
  documents Document[]

  @@map("tenants")
}

model User {
  id        BigInt     @id @default(autoincrement())
  email     String     @unique
  documents Document[] @relation("creator")

  @@map("users")
}
```

**Dateien-Struktur:**

```
prisma/
  schema.prisma       # Prisma-Schema-Datei
  migrations/         # Von prisma migrate generiert
lib/
  db.ts               # Prisma-Client-Export
```

**Prisma-Client (`lib/db.ts`):**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```
