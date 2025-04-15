-- AlterTable
ALTER TABLE "paper_stocks" ADD COLUMN     "paper_request_id" TEXT;

-- AddForeignKey
ALTER TABLE "paper_stocks" ADD CONSTRAINT "paper_stocks_paper_request_id_fkey" FOREIGN KEY ("paper_request_id") REFERENCES "paper_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
