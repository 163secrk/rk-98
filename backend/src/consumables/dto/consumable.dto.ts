import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ConsumableType, ConsumableStatus } from '../../entities/consumable.entity';

export class CreateConsumableDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ConsumableType)
  type: ConsumableType;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  threshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateConsumableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ConsumableType)
  @IsOptional()
  type?: ConsumableType;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  threshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsEnum(ConsumableStatus)
  @IsOptional()
  status?: ConsumableStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class InboundConsumableDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  batchNo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class ConsumeConsumableDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class AdjustConsumableDto {
  @IsNumber()
  stock: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
