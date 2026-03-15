-- Magic Code: Fehlversuche-Zähler für Rate-Limiting
ALTER TABLE "Nutzer" ADD COLUMN "magicCodeVersuche" INTEGER NOT NULL DEFAULT 0;
