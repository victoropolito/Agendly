-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "reminderSentAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "appointments_status_reminderSentAt_startsAt_idx" ON "appointments"("status", "reminderSentAt", "startsAt");
