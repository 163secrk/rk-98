import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, IsEnum, IsDateString, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order.entity';

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  clothingTypeId: string;

  @IsString()
  @IsNotEmpty()
  clothingName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsDateString()
  @IsOptional()
  pickupDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
