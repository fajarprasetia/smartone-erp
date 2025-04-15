/*
  Warnings:

  - You are about to drop the `InkStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InkStock" DROP CONSTRAINT "InkStock_added_by_fkey";

-- DropTable
DROP TABLE "InkStock";

-- CreateTable
CREATE TABLE "ink_stocks" (
    "id" TEXT NOT NULL,
    "barcode_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "supplier" TEXT,
    "added_by" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "takenByUserId" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3),
    "dateTaken" TIMESTAMP(3),
    "notes" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "availability" "InventoryAvailability" NOT NULL DEFAULT 'YES',
    "inkRequestId" TEXT,

    CONSTRAINT "ink_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ink_requests" (
    "id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "ink_type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "user_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "rejected_by" TEXT,
    "ink_stock_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ink_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ink_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "notes" TEXT,
    "ink_stock_id" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ink_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ink_stocks_barcode_id_key" ON "ink_stocks"("barcode_id");

-- CreateIndex
CREATE UNIQUE INDEX "ink_stocks_inkRequestId_key" ON "ink_stocks"("inkRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ink_requests_ink_stock_id_key" ON "ink_requests"("ink_stock_id");

-- AddForeignKey
ALTER TABLE "ink_stocks" ADD CONSTRAINT "ink_stocks_inkRequestId_fkey" FOREIGN KEY ("inkRequestId") REFERENCES "ink_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_stocks" ADD CONSTRAINT "ink_stocks_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_stocks" ADD CONSTRAINT "ink_stocks_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_stocks" ADD CONSTRAINT "ink_stocks_takenByUserId_fkey" FOREIGN KEY ("takenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_requests" ADD CONSTRAINT "ink_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_requests" ADD CONSTRAINT "ink_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_requests" ADD CONSTRAINT "ink_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_logs" ADD CONSTRAINT "ink_logs_ink_stock_id_fkey" FOREIGN KEY ("ink_stock_id") REFERENCES "ink_stocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_logs" ADD CONSTRAINT "ink_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ink_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ink_logs" ADD CONSTRAINT "ink_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
