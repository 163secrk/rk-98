import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches } from 'class-validator';
import { StoreStatus } from '../../entities/store.entity';

const PHONE_REGEX = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, { message: '联系电话格式不正确，请输入有效的手机号或座机号' })
  phone: string;

  @IsString()
  @IsOptional()
  manager?: string;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;
}

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: '联系电话格式不正确，请输入有效的手机号或座机号' })
  phone?: string;

  @IsString()
  @IsOptional()
  manager?: string;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;
}
