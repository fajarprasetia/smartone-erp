-- AlterTable
ALTER TABLE "paper_requests" ADD COLUMN     "paper_type" TEXT NOT NULL DEFAULT 'Sublimation Paper';

-- AlterTable
ALTER TABLE "paper_stocks" ADD COLUMN     "paper_type" TEXT NOT NULL DEFAULT 'Sublimation Paper';
