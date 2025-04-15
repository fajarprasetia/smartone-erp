/*
  Warnings:

  - You are about to drop the `PaperStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaperStock" DROP CONSTRAINT "PaperStock_addedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "PaperStock" DROP CONSTRAINT "PaperStock_paperRequestId_fkey";

-- DropForeignKey
ALTER TABLE "PaperStock" DROP CONSTRAINT "PaperStock_takenByUserId_fkey";

-- DropForeignKey
ALTER TABLE "PaperStock" DROP CONSTRAINT "PaperStock_updatedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "paper_logs" DROP CONSTRAINT "paper_logs_paper_stock_id_fkey";

-- DropTable
DROP TABLE "PaperStock";

-- CreateTable
CREATE TABLE "paper_stocks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "length" DOUBLE PRECISION,
    "gsm" INTEGER NOT NULL,
    "thickness" DOUBLE PRECISION,
    "remainingLength" DOUBLE PRECISION,
    "addedByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "takenByUserId" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3),
    "dateTaken" TIMESTAMP(3),
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "qrCode" TEXT,
    "paperRequestId" TEXT,
    "availability" "InventoryAvailability" NOT NULL DEFAULT 'YES',

    CONSTRAINT "paper_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paper_stocks_qrCode_key" ON "paper_stocks"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "paper_stocks_paperRequestId_key" ON "paper_stocks"("paperRequestId");

-- AddForeignKey
ALTER TABLE "paper_stocks" ADD CONSTRAINT "paper_stocks_paperRequestId_fkey" FOREIGN KEY ("paperRequestId") REFERENCES "paper_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_stocks" ADD CONSTRAINT "paper_stocks_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_stocks" ADD CONSTRAINT "paper_stocks_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_stocks" ADD CONSTRAINT "paper_stocks_takenByUserId_fkey" FOREIGN KEY ("takenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_logs" ADD CONSTRAINT "paper_logs_paper_stock_id_fkey" FOREIGN KEY ("paper_stock_id") REFERENCES "paper_stocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
