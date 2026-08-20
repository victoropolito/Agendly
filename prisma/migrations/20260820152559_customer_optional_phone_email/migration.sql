-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "phoneNormalized" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phoneNormalized" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_email_key" ON "customers"("tenantId", "email");
