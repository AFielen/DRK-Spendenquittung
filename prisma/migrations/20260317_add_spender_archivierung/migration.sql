-- AlterTable
ALTER TABLE "Spender" ADD COLUMN "archiviert" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Spender" ADD COLUMN "archiviertAm" TIMESTAMP(3);
