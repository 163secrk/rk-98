import { IsString, IsNotEmpty, IsOptional, IsEnum, MinLength, IsUUID } from 'class-validator';
import { UserRole, StaffStatus } from '../../entities/staff.entity';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  storeId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  storeId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;

  @IsString()
  @MinLength(4)
  @IsOptional()
  password?: string;
}
