/*
  Warnings:

  - The `cutting_done` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dtf_done` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `press_done` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `print_done` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "waktu_rip" TIME,
DROP COLUMN "cutting_done",
ADD COLUMN     "cutting_done" DATE,
DROP COLUMN "dtf_done",
ADD COLUMN     "dtf_done" DATE,
DROP COLUMN "press_done",
ADD COLUMN     "press_done" DATE,
DROP COLUMN "print_done",
ADD COLUMN     "print_done" DATE;
