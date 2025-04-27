/*
  Warnings:

  - You are about to drop the column `value` on the `assets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assets" DROP COLUMN "value",
ADD COLUMN     "last_maintenance_date" TIMESTAMP(3),
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "next_maintenance_date" TIMESTAMP(3),
ADD COLUMN     "purchase_price" TEXT,
ADD COLUMN     "warranty_expiry" TIMESTAMP(3);
