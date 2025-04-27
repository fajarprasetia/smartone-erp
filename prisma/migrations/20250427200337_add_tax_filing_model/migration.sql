/*
  Warnings:

  - You are about to drop the column `description` on the `TaxFiling` table. All the data in the column will be lost.
  - You are about to drop the column `filingDate` on the `TaxFiling` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `TaxFiling` table. All the data in the column will be lost.
  - You are about to drop the column `referenceNumber` on the `TaxFiling` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TaxType_name_key";

-- AlterTable
ALTER TABLE "TaxFiling" DROP COLUMN "description",
DROP COLUMN "filingDate",
DROP COLUMN "paymentDate",
DROP COLUMN "referenceNumber",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';
