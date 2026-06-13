import { IsOptional, IsString } from 'class-validator';

export class DailyReportQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  storeId?: string;
}
