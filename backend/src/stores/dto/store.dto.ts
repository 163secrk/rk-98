import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { StoreStatus } from '../../entities/store.entity';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
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
  phone?: string;

  @IsString()
  @IsOptional()
  manager?: string;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;
}
