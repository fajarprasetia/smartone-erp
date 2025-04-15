/*
  Warnings:

  - You are about to drop the `paper_stocks` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paper_stock_id]` on the table `paper_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "paper_logs" DROP CONSTRAINT "paper_logs_paper_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "paper_requests" DROP CONSTRAINT "paper_requests_paper_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "paper_stocks" DROP CONSTRAINT "paper_stocks_paper_request_id_fkey";

-- DropTable
DROP TABLE "paper_stocks";

-- CreateTable
CREATE TABLE "PaperStock" (
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

    CONSTRAINT "PaperStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaperStock_qrCode_key" ON "PaperStock"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "PaperStock_paperRequestId_key" ON "PaperStock"("paperRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "paper_requests_paper_stock_id_key" ON "paper_requests"("paper_stock_id");

-- AddForeignKey
ALTER TABLE "PaperStock" ADD CONSTRAINT "PaperStock_paperRequestId_fkey" FOREIGN KEY ("paperRequestId") REFERENCES "paper_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperStock" ADD CONSTRAINT "PaperStock_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperStock" ADD CONSTRAINT "PaperStock_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperStock" ADD CONSTRAINT "PaperStock_takenByUserId_fkey" FOREIGN KEY ("takenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_logs" ADD CONSTRAINT "paper_logs_paper_stock_id_fkey" FOREIGN KEY ("paper_stock_id") REFERENCES "PaperStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
