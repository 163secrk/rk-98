import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsUUID } from 'class-validator';
import { PackageStatus } from '../../entities/package.entity';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  clothingTypeId: string;

  @IsNumber()
  @Min(1)
  totalCount: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PackageStatus)
  @IsOptional()
  status?: PackageStatus;

  @IsNumber()
  @IsOptional()
  validDays?: number;
}

export class UpdatePackageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  clothingTypeId?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  totalCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PackageStatus)
  @IsOptional()
  status?: PackageStatus;

  @IsNumber()
  @IsOptional()
  validDays?: number;
}
