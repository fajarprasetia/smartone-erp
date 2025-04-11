/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - The `asal_bahan` column on the `inventory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `customerId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `cutting_done` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `dtf_done` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `jns_produk_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `press_done` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `print_done` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tgl_cutting` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tgl_dtf` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tgl_press` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `tgl_print` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `waktu_rip` on the `orders` table. All the data in the column will be lost.
  - The `asal_bahan` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Production` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `customerId` on the `ChatMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_customerId_fkey";

-- DropForeignKey
ALTER TABLE "OrderDetails" DROP CONSTRAINT "OrderDetails_customerId_fkey";

-- DropForeignKey
ALTER TABLE "OrderDetails" DROP CONSTRAINT "OrderDetails_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Production" DROP CONSTRAINT "Production_orderDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "Production" DROP CONSTRAINT "Production_orderId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customerId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "customerId",
ADD COLUMN     "customerId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "DashboardCard" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "FinancialTransaction" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "WhatsAppConfig" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WhatsAppTemplate" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "asal_bahan",
ADD COLUMN     "asal_bahan" BIGINT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "customerId",
DROP COLUMN "cutting_done",
DROP COLUMN "dtf_done",
DROP COLUMN "jns_produk_id",
DROP COLUMN "press_done",
DROP COLUMN "print_done",
DROP COLUMN "tgl_cutting",
DROP COLUMN "tgl_dtf",
DROP COLUMN "tgl_press",
DROP COLUMN "tgl_print",
DROP COLUMN "user_id",
DROP COLUMN "waktu_rip",
ALTER COLUMN "opr_id" SET DATA TYPE TEXT,
ALTER COLUMN "print_id" SET DATA TYPE TEXT,
ALTER COLUMN "press_id" SET DATA TYPE TEXT,
ALTER COLUMN "cutting_id" SET DATA TYPE TEXT,
ALTER COLUMN "dtf_id" SET DATA TYPE TEXT,
ALTER COLUMN "penyerahan_id" SET DATA TYPE TEXT,
ALTER COLUMN "designer_id" SET DATA TYPE TEXT,
ALTER COLUMN "manager_id" SET DATA TYPE TEXT,
ALTER COLUMN "customer_id" SET DATA TYPE BIGINT,
DROP COLUMN "asal_bahan",
ADD COLUMN     "asal_bahan" BIGINT;

-- DropTable
DROP TABLE "Customer";

-- DropTable
DROP TABLE "OrderDetails";

-- DropTable
DROP TABLE "OrderItem";

-- DropTable
DROP TABLE "Production";

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_asal_bahan_fkey" FOREIGN KEY ("asal_bahan") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_asal_bahan_fkey" FOREIGN KEY ("asal_bahan") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_penyerahan_id_fkey" FOREIGN KEY ("penyerahan_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_dtf_id_fkey" FOREIGN KEY ("dtf_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cutting_id_fkey" FOREIGN KEY ("cutting_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_press_id_fkey" FOREIGN KEY ("press_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_print_id_fkey" FOREIGN KEY ("print_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_opr_id_fkey" FOREIGN KEY ("opr_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
