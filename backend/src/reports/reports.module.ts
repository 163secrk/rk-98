import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order } from '../entities/order.entity';
import { RechargeRecord } from '../entities/recharge-record.entity';
import { MemberPackage } from '../entities/member-package.entity';
import { ConsumableRecord } from '../entities/consumable-record.entity';
import { Store } from '../entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, RechargeRecord, MemberPackage, ConsumableRecord, Store]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
