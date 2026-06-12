import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClothingTypesService } from './clothing-types.service';
import { ClothingTypesController } from './clothing-types.controller';
import { ClothingType } from '../entities/clothing-type.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClothingType]), AuthModule],
  controllers: [ClothingTypesController],
  providers: [ClothingTypesService],
  exports: [ClothingTypesService],
})
export class ClothingTypesModule {}
