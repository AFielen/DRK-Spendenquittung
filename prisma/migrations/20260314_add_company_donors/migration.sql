-- Add company donor support
ALTER TABLE "Spender" ADD COLUMN IF NOT EXISTS "istFirma" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Spender" ADD COLUMN IF NOT EXISTS "firmenname" TEXT;
ALTER TABLE "Spender" ALTER COLUMN "vorname" DROP NOT NULL;
