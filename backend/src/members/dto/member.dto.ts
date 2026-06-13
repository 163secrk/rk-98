import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsUUID, Matches } from 'class-validator';
import { MemberLevel } from '../../entities/member.entity';
import { RechargeType } from '../../entities/recharge-record.entity';

const PHONE_REGEX = /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

export enum DeductionPriority {
  PACKAGE_FIRST = 'package_first',
  BALANCE_FIRST = 'balance_first',
  PACKAGE_ONLY = 'package_only',
  BALANCE_ONLY = 'balance_only',
}

export class RegisterMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_REGEX, { message: '联系电话格式不正确' })
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class RechargeDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(RechargeType)
  @IsOptional()
  payType?: RechargeType;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsEnum(MemberLevel)
  @IsOptional()
  level?: MemberLevel;

  @IsOptional()
  isActive?: boolean;
}

export class RechargeBonusRule {
  static calculateBonus(amount: number): number {
    if (amount >= 1000) {
      return Math.floor(amount / 1000) * 200;
    }
    if (amount >= 500) {
      return Math.floor(amount / 500) * 80;
    }
    if (amount >= 200) {
      return Math.floor(amount / 200) * 20;
    }
    return 0;
  }
}

export class PurchasePackageDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class SettleOrderDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(DeductionPriority)
  @IsOptional()
  priority?: DeductionPriority;

  @IsString()
  @IsOptional()
  remark?: string;
}
