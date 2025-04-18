-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "holdReason" TEXT,
ADD COLUMN     "previousStatus" VARCHAR(255);
