-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "berechtigungen" TEXT[],
    "kreisverbandId" TEXT NOT NULL,
    "nutzerId" TEXT NOT NULL,
    "letzteNutzung" TIMESTAMP(3),
    "ablaufDatum" TIMESTAMP(3),
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_kreisverbandId_idx" ON "ApiKey"("kreisverbandId");
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_kreisverbandId_fkey" FOREIGN KEY ("kreisverbandId") REFERENCES "Kreisverband"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
