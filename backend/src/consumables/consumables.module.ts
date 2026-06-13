import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumablesService } from './consumables.service';
import { ConsumablesController } from './consumables.controller';
import { Consumable } from '../entities/consumable.entity';
import { ConsumableRecord } from '../entities/consumable-record.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consumable, ConsumableRecord]), AuthModule],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
