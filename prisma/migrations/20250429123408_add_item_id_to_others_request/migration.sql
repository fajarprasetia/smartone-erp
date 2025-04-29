/*
  Warnings:

  - Added the required column `item_id` to the `others_requests` table without a default value. This is not possible if the table is not empty.

*/
-- Add item_id column as nullable first
ALTER TABLE "others_requests" ADD COLUMN "item_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "others_requests" ADD CONSTRAINT "others_requests_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "others_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update existing rows with a valid item ID
UPDATE "others_requests" SET "item_id" = 'cma2bxec3001h3i1u73mey8xq' WHERE "item_id" IS NULL;

-- Make the column required
ALTER TABLE "others_requests" ALTER COLUMN "item_id" SET NOT NULL;
