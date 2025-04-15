-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_createdById_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "jns_produk_id" INTEGER;

-- CreateTable
CREATE TABLE "Produk" (
    "id" SERIAL NOT NULL,
    "nama_produk" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produk_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_jns_produk_id_fkey" FOREIGN KEY ("jns_produk_id") REFERENCES "Produk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
