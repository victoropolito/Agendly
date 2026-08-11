import { Module } from '@nestjs/common';

import { TenantModule } from '../tenants/tenant.module';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [TenantModule],
  controllers: [ServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
