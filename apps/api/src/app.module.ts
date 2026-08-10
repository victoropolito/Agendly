import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenants/tenant.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, TenantModule],
  controllers: [HealthController],
})
export class AppModule {}
