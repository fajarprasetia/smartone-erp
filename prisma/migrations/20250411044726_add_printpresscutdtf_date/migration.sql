-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cutting_done" VARCHAR(255),
ADD COLUMN     "dtf_done" VARCHAR(255),
ADD COLUMN     "press_done" VARCHAR(255),
ADD COLUMN     "print_done" VARCHAR(255),
ADD COLUMN     "tgl_cutting" DATE,
ADD COLUMN     "tgl_dtf" DATE,
ADD COLUMN     "tgl_press" DATE;
