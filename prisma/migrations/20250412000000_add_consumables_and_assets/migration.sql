-- CreateEnum
CREATE TYPE "PaperRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InventoryAvailability" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "PaperStock" (
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
    "availability" "InventoryAvailability" NOT NULL DEFAULT 'YES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperRequest" (
    "id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "gsm" TEXT NOT NULL,
    "width" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "user_notes" TEXT,
    "status" "PaperRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "rejected_by" TEXT,
    "paper_stock_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperLog" (
    "id" TEXT NOT NULL,
    "paper_stock_id" TEXT,
    "request_id" TEXT,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InkStock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "type" TEXT,
    "quantity" TEXT,
    "unit" TEXT,
    "supplier" TEXT,
    "added_by" TEXT NOT NULL,
    "notes" TEXT,
    "availability" "InventoryAvailability" NOT NULL DEFAULT 'YES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherConsumable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "quantity" TEXT,
    "unit" TEXT,
    "supplier" TEXT,
    "added_by" TEXT NOT NULL,
    "notes" TEXT,
    "availability" "InventoryAvailability" NOT NULL DEFAULT 'YES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherConsumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "serial_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "supplier" TEXT,
    "value" DECIMAL(65,30),
    "status" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperRequest" ADD CONSTRAINT "PaperRequest_paper_stock_id_fkey" FOREIGN KEY ("paper_stock_id") REFERENCES "PaperStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperLog" ADD CONSTRAINT "PaperLog_paper_stock_id_fkey" FOREIGN KEY ("paper_stock_id") REFERENCES "PaperStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperLog" ADD CONSTRAINT "PaperLog_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "PaperRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperLog" ADD CONSTRAINT "PaperLog_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InkStock" ADD CONSTRAINT "InkStock_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherConsumable" ADD CONSTRAINT "OtherConsumable_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;