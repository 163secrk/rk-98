import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, IsEnum, IsDateString, Min, ArrayMinSize, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order.entity';

const PHONE_REGEX = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

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
  @Matches(PHONE_REGEX, { message: '联系电话格式不正确，请输入有效的手机号或座机号' })
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsUUID()
  @IsOptional()
  memberId?: string;

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
