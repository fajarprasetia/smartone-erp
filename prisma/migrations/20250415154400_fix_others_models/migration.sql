/*
  Warnings:

  - You are about to drop the `OthersItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OthersRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OthersItem" DROP CONSTRAINT "OthersItem_taken_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersItem" DROP CONSTRAINT "OthersItem_user_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersLog" DROP CONSTRAINT "OthersLog_others_item_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersLog" DROP CONSTRAINT "OthersLog_others_request_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersRequest" DROP CONSTRAINT "OthersRequest_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersRequest" DROP CONSTRAINT "OthersRequest_rejector_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersRequest" DROP CONSTRAINT "OthersRequest_user_id_fkey";

-- DropTable
DROP TABLE "OthersItem";

-- DropTable
DROP TABLE "OthersRequest";

-- CreateTable
CREATE TABLE "others_item" (
    "id" TEXT NOT NULL,
    "qr_code" TEXT,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT NOT NULL,
    "taken_by_user_id" TEXT,
    "taken_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "others_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "others_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "user_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "rejector_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "approver_notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "others_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "others_item_qr_code_key" ON "others_item"("qr_code");

-- AddForeignKey
ALTER TABLE "others_item" ADD CONSTRAINT "others_item_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "others_item" ADD CONSTRAINT "others_item_taken_by_user_id_fkey" FOREIGN KEY ("taken_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "others_requests" ADD CONSTRAINT "others_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "others_requests" ADD CONSTRAINT "others_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "others_requests" ADD CONSTRAINT "others_requests_rejector_id_fkey" FOREIGN KEY ("rejector_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersLog" ADD CONSTRAINT "OthersLog_others_request_id_fkey" FOREIGN KEY ("others_request_id") REFERENCES "others_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersLog" ADD CONSTRAINT "OthersLog_others_item_id_fkey" FOREIGN KEY ("others_item_id") REFERENCES "others_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
