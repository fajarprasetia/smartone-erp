-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_createdAt_idx" ON "Permission"("createdAt");

-- CreateIndex
CREATE INDEX "Role_isSystem_idx" ON "Role"("isSystem");

-- CreateIndex
CREATE INDEX "Role_isAdmin_idx" ON "Role"("isAdmin");

-- CreateIndex
CREATE INDEX "Role_createdAt_idx" ON "Role"("createdAt");
