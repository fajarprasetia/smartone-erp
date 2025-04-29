/*
  Warnings:

  - You are about to drop the column `closedAt` on the `FinancialPeriod` table. All the data in the column will be lost.
  - You are about to drop the column `isClosed` on the `FinancialPeriod` table. All the data in the column will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdBy` to the `FinancialPeriod` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `FinancialPeriod` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `FinancialPeriod` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChartOfAccount" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FinancialPeriod" DROP COLUMN "closedAt",
DROP COLUMN "isClosed",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "month" INTEGER,
ADD COLUMN     "quarter" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postedById" TEXT;

-- DropTable
DROP TABLE "Asset";

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "supplier" TEXT,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_maintenance_date" TIMESTAMP(3),
    "manufacturer" TEXT,
    "model" TEXT,
    "next_maintenance_date" TIMESTAMP(3),
    "purchase_date" TIMESTAMP(3),
    "purchase_price" TEXT,
    "serial_number" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "warranty_expiry" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_maintenance_records" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "next_maintenance_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxFiling" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "filingDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxFiling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialPeriod_year_idx" ON "FinancialPeriod"("year");

-- CreateIndex
CREATE INDEX "FinancialPeriod_type_idx" ON "FinancialPeriod"("type");

-- CreateIndex
CREATE INDEX "FinancialPeriod_status_idx" ON "FinancialPeriod"("status");

-- CreateIndex
CREATE INDEX "FinancialPeriod_createdBy_idx" ON "FinancialPeriod"("createdBy");

-- AddForeignKey
ALTER TABLE "FinancialPeriod" ADD CONSTRAINT "FinancialPeriod_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance_records" ADD CONSTRAINT "asset_maintenance_records_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
