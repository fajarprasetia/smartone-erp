/*
  Warnings:

  - Added the required column `year` to the `FinancialPeriod` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FinancialPeriod" ADD COLUMN     "month" INTEGER,
ADD COLUMN     "quarter" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'FISCAL',
ADD COLUMN     "year" INTEGER NOT NULL;
