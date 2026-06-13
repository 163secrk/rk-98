import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Customer } from '../entities/customer.entity';
import { AuthModule } from '../auth/auth.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Customer]), AuthModule, MembersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
