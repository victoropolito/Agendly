import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppointmentModule } from './appointments/appointment.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { CustomerModule } from './customers/customer.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfessionalModule } from './professionals/professional.module';
import { PublicModule } from './public/public.module';
import { ScheduleBlockModule } from './schedule-blocks/schedule-block.module';
import { ServiceModule } from './services/service.module';
import { TenantModule } from './tenants/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
          maxRetriesPerRequest: null,
        },
        // Namespaces every queue's keys so this app can safely share one Redis instance with
        // other services (e.g. the Evolution API server, which prefixes its own keys too).
        prefix: 'agendly',
      }),
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    ServiceModule,
    ProfessionalModule,
    CustomerModule,
    AvailabilityModule,
    AppointmentModule,
    ScheduleBlockModule,
    PublicModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
