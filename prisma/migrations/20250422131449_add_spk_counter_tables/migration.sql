-- CreateTable
CREATE TABLE "SpkCounter" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpkCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempSpkReservation" (
    "id" TEXT NOT NULL,
    "spk" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempSpkReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpkCounter_prefix_key" ON "SpkCounter"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "TempSpkReservation_spk_key" ON "TempSpkReservation"("spk");

-- CreateIndex
CREATE INDEX "TempSpkReservation_expiresAt_idx" ON "TempSpkReservation"("expiresAt");
