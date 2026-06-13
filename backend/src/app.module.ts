import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { StaffModule } from './staff/staff.module';
import { ClothingTypesModule } from './clothing-types/clothing-types.module';
import { OrdersModule } from './orders/orders.module';
import { MembersModule } from './members/members.module';
import { PackagesModule } from './packages/packages.module';
import { ConsumablesModule } from './consumables/consumables.module';
import { Store } from './entities/store.entity';
import { Staff } from './entities/staff.entity';
import { Customer } from './entities/customer.entity';
import { ClothingType } from './entities/clothing-type.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Member } from './entities/member.entity';
import { RechargeRecord } from './entities/recharge-record.entity';
import { Package } from './entities/package.entity';
import { MemberPackage } from './entities/member-package.entity';
import { DeductionRecord } from './entities/deduction-record.entity';
import { Consumable } from './entities/consumable.entity';
import { ConsumableRecord } from './entities/consumable-record.entity';
import { StaffService } from './staff/staff.service';
import { ClothingTypesService } from './clothing-types/clothing-types.service';
import { PackagesService } from './packages/packages.service';
import { ConsumablesService } from './consumables/consumables.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(__dirname, '..', 'data', 'laundry.db'),
      entities: [Store, Staff, Customer, ClothingType, Order, OrderItem, Member, RechargeRecord, Package, MemberPackage, DeductionRecord, Consumable, ConsumableRecord],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    StoresModule,
    StaffModule,
    ClothingTypesModule,
    OrdersModule,
    MembersModule,
    PackagesModule,
    ConsumablesModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly staffService: StaffService,
    private readonly clothingTypesService: ClothingTypesService,
    private readonly packagesService: PackagesService,
    private readonly consumablesService: ConsumablesService,
  ) {}

  async onModuleInit() {
    const fs = require('fs');
    const dataDir = join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    await this.staffService.initAdmin();
    await this.clothingTypesService.initDefaultData();
    await this.packagesService.initDefaultData();
    await this.consumablesService.initDefaultData();
  }
}
