-- AlterTable
ALTER TABLE "auth_sessions" ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_userId_key" ON "customers"("tenantId", "userId");
