import { Module } from '@nestjs/common';

import { TenantModule } from '../tenants/tenant.module';
import { ScheduleBlockController } from './schedule-block.controller';
import { ScheduleBlockService } from './schedule-block.service';

@Module({
  imports: [TenantModule],
  controllers: [ScheduleBlockController],
  providers: [ScheduleBlockService],
})
export class ScheduleBlockModule {}
