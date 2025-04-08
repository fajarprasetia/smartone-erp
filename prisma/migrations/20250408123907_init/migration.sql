/*
  Warnings:

  - You are about to drop the `PageAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PageAccessToRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PageAccessToRole" DROP CONSTRAINT "_PageAccessToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_PageAccessToRole" DROP CONSTRAINT "_PageAccessToRole_B_fkey";

-- DropTable
DROP TABLE "PageAccess";

-- DropTable
DROP TABLE "_PageAccessToRole";
