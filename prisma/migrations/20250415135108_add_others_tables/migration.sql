-- CreateTable
CREATE TABLE "OthersItem" (
    "id" TEXT NOT NULL,
    "qr_code" TEXT,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT NOT NULL,
    "taken_by_user_id" TEXT,
    "taken_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OthersItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OthersRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "user_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "rejector_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "approver_notes" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OthersRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OthersLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "others_request_id" TEXT,
    "others_item_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OthersLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OthersItem_qr_code_key" ON "OthersItem"("qr_code");

-- AddForeignKey
ALTER TABLE "OthersItem" ADD CONSTRAINT "OthersItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersItem" ADD CONSTRAINT "OthersItem_taken_by_user_id_fkey" FOREIGN KEY ("taken_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersRequest" ADD CONSTRAINT "OthersRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersRequest" ADD CONSTRAINT "OthersRequest_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersRequest" ADD CONSTRAINT "OthersRequest_rejector_id_fkey" FOREIGN KEY ("rejector_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersLog" ADD CONSTRAINT "OthersLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersLog" ADD CONSTRAINT "OthersLog_others_request_id_fkey" FOREIGN KEY ("others_request_id") REFERENCES "OthersRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OthersLog" ADD CONSTRAINT "OthersLog_others_item_id_fkey" FOREIGN KEY ("others_item_id") REFERENCES "OthersItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
