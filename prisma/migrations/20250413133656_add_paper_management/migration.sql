/*
  Warnings:

  - You are about to drop the `PaperLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaperRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaperStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaperLog" DROP CONSTRAINT "PaperLog_paper_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "PaperLog" DROP CONSTRAINT "PaperLog_performed_by_fkey";

-- DropForeignKey
ALTER TABLE "PaperLog" DROP CONSTRAINT "PaperLog_request_id_fkey";

-- DropForeignKey
ALTER TABLE "PaperRequest" DROP CONSTRAINT "PaperRequest_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "PaperRequest" DROP CONSTRAINT "PaperRequest_paper_stock_id_fkey";

-- DropForeignKey
ALTER TABLE "PaperRequest" DROP CONSTRAINT "PaperRequest_rejected_by_fkey";

-- DropForeignKey
ALTER TABLE "PaperRequest" DROP CONSTRAINT "PaperRequest_requested_by_fkey";

-- DropTable
DROP TABLE "PaperLog";

-- DropTable
DROP TABLE "PaperRequest";

-- DropTable
DROP TABLE "PaperStock";

-- CreateTable
CREATE TABLE "paper_stocks" (
    "id" TEXT NOT NULL,
    "barcode_id" TEXT,
    "supplier" TEXT,
    "gsm" TEXT NOT NULL,
    "width" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "used" TEXT,
    "waste" TEXT,
    "remaining_length" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "taken_by" TEXT,
    "notes" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'YES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "paper_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_requests" (
    "id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "gsm" TEXT NOT NULL,
    "width" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "user_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "rejected_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paper_stock_id" TEXT,

    CONSTRAINT "paper_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paper_stock_id" TEXT,
    "request_id" TEXT,

    CONSTRAINT "paper_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paper_stocks_barcode_id_key" ON "paper_stocks"("barcode_id");

-- AddForeignKey
ALTER TABLE "paper_requests" ADD CONSTRAINT "paper_requests_paper_stock_id_fkey" FOREIGN KEY ("paper_stock_id") REFERENCES "paper_stocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_requests" ADD CONSTRAINT "paper_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_requests" ADD CONSTRAINT "paper_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_requests" ADD CONSTRAINT "paper_requests_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_logs" ADD CONSTRAINT "paper_logs_paper_stock_id_fkey" FOREIGN KEY ("paper_stock_id") REFERENCES "paper_stocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_logs" ADD CONSTRAINT "paper_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "paper_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_logs" ADD CONSTRAINT "paper_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
