/*
  Warnings:

  - You are about to drop the `OthersLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OthersLog" DROP CONSTRAINT "OthersLog_others_item_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersLog" DROP CONSTRAINT "OthersLog_others_request_id_fkey";

-- DropForeignKey
ALTER TABLE "OthersLog" DROP CONSTRAINT "OthersLog_user_id_fkey";

-- DropTable
DROP TABLE "OthersLog";

-- CreateTable
CREATE TABLE "others_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "others_request_id" TEXT,
    "others_item_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "others_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "others_log" ADD CONSTRAINT "others_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "others_log" ADD CONSTRAINT "others_log_others_request_id_fkey" FOREIGN KEY ("others_request_id") REFERENCES "others_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "others_log" ADD CONSTRAINT "others_log_others_item_id_fkey" FOREIGN KEY ("others_item_id") REFERENCES "others_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
