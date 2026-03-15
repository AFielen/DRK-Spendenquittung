-- Merge zahlungsart into zugangsweg: copy values where zugangsweg is empty
UPDATE "Zuwendung"
SET "zugangsweg" = "zahlungsart"
WHERE "zugangsweg" IS NULL
  AND "zahlungsart" IS NOT NULL;

-- Drop the redundant zahlungsart column
ALTER TABLE "Zuwendung" DROP COLUMN "zahlungsart";
