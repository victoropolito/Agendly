-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('ADMIN', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('PUBLIC', 'ADMIN', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "ScheduleEntryKind" AS ENUM ('APPOINTMENT', 'BLOCK');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_REMINDER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppProvider" AS ENUM ('META_CLOUD_API', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "phone" VARCHAR(32),
    "email" VARCHAR(255),
    "description" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phoneNormalized" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "passwordHash" VARCHAR(255) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "TenantRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(32),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "name" VARCHAR(120) NOT NULL,
    "phoneNormalized" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_services" (
    "tenantId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("professionalId","serviceId")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_hours" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "professional_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "priceCentsSnapshot" INTEGER NOT NULL,
    "durationMinutesSnapshot" INTEGER NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "source" "AppointmentSource" NOT NULL DEFAULT 'PUBLIC',
    "notes" TEXT,
    "cancelledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_entries" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "appointmentId" UUID,
    "scheduleBlockId" UUID,
    "kind" "ScheduleEntryKind" NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "appointmentId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "provider" "WhatsAppProvider" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "phoneNumberId" VARCHAR(255),
    "businessAccountId" VARCHAR(255),
    "credentialsReference" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNormalized_key" ON "users"("phoneNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tenant_members_userId_idx" ON "tenant_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_tenantId_userId_role_key" ON "tenant_members"("tenantId", "userId", "role");

-- CreateIndex
CREATE INDEX "professionals_tenantId_isActive_idx" ON "professionals"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_tenantId_userId_key" ON "professionals"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "customers_tenantId_name_idx" ON "customers"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_phoneNormalized_key" ON "customers"("tenantId", "phoneNormalized");

-- CreateIndex
CREATE INDEX "services_tenantId_isActive_idx" ON "services"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "professional_services_tenantId_serviceId_idx" ON "professional_services"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "business_hours_tenantId_weekday_idx" ON "business_hours"("tenantId", "weekday");

-- CreateIndex
CREATE INDEX "professional_hours_tenantId_professionalId_weekday_idx" ON "professional_hours"("tenantId", "professionalId", "weekday");

-- CreateIndex
CREATE INDEX "appointments_tenantId_startsAt_idx" ON "appointments"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_professionalId_startsAt_idx" ON "appointments"("professionalId", "startsAt");

-- CreateIndex
CREATE INDEX "schedule_blocks_professionalId_startsAt_idx" ON "schedule_blocks"("professionalId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_entries_appointmentId_key" ON "schedule_entries"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_entries_scheduleBlockId_key" ON "schedule_entries"("scheduleBlockId");

-- CreateIndex
CREATE INDEX "schedule_entries_tenantId_professionalId_startsAt_idx" ON "schedule_entries"("tenantId", "professionalId", "startsAt");

-- CreateIndex
CREATE INDEX "notifications_tenantId_status_createdAt_idx" ON "notifications"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_tenantId_provider_key" ON "whatsapp_connections"("tenantId", "provider");

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_hours" ADD CONSTRAINT "professional_hours_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_scheduleBlockId_fkey" FOREIGN KEY ("scheduleBlockId") REFERENCES "schedule_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_connections" ADD CONSTRAINT "whatsapp_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Agenda: uma alocação (agendamento ou bloqueio) não pode sobrepor outra do
-- mesmo profissional. O intervalo é semiaberto: [início, fim).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "schedule_entries"
  ADD CONSTRAINT "schedule_entries_valid_interval"
  CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "schedule_entries_professional_time_no_overlap"
  EXCLUDE USING gist (
    "professionalId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  );
