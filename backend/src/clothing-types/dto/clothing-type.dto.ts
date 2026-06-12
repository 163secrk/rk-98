import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ClothingStatus } from '../../entities/clothing-type.entity';

export class CreateClothingTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ClothingStatus)
  @IsOptional()
  status?: ClothingStatus;
}

export class UpdateClothingTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ClothingStatus)
  @IsOptional()
  status?: ClothingStatus;
}
