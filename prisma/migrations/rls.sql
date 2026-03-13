-- Row-Level Security Policies
-- Phase 2: Diese Policies können nach dem MVP auf DB-Ebene aktiviert werden.
-- Für den MVP wird die Mandantenisolation über API-Routes sichergestellt
-- (WHERE kreisverbandId = session.kreisverbandId in jeder Query).

-- ALTER TABLE "Spender" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Zuwendung" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Nutzer" ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY spender_tenant_isolation ON "Spender"
--   USING ("kreisverbandId" = current_setting('app.kreisverband_id')::text);

-- CREATE POLICY zuwendung_tenant_isolation ON "Zuwendung"
--   USING ("kreisverbandId" = current_setting('app.kreisverband_id')::text);

-- CREATE POLICY nutzer_tenant_isolation ON "Nutzer"
--   USING ("kreisverbandId" = current_setting('app.kreisverband_id')::text);
