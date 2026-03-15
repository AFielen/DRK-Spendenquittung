-- AlterTable
ALTER TABLE "Zuwendung" ADD COLUMN "zweckgebunden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Zuwendung" ADD COLUMN "zweckbindung" TEXT;
ALTER TABLE "Zuwendung" ADD COLUMN "zweckVerwendet" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Zuwendung" ADD COLUMN "zweckVerwendetDatum" TIMESTAMP(3);
ALTER TABLE "Zuwendung" ADD COLUMN "zweckVerwendetNotiz" TEXT;
