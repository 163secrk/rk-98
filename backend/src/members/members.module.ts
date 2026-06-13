import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from '../entities/member.entity';
import { Customer } from '../entities/customer.entity';
import { RechargeRecord } from '../entities/recharge-record.entity';
import { MemberPackage } from '../entities/member-package.entity';
import { Package } from '../entities/package.entity';
import { DeductionRecord } from '../entities/deduction-record.entity';
import { Order } from '../entities/order.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, Customer, RechargeRecord, MemberPackage, Package, DeductionRecord, Order]),
    AuthModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
