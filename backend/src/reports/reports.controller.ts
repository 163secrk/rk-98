import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { DailyReportQueryDto } from './dto/report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  async getDailyReport(@Query() query: DailyReportQueryDto) {
    return this.reportsService.getDailyReport(query);
  }

  @Get('daily/export')
  async exportDailyReport(@Query() query: DailyReportQueryDto, @Res() res: Response) {
    const csvContent = await this.reportsService.exportDailyReport(query);
    const fileName = `财务日结报表_${query.startDate || 'all'}_${query.endDate || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(csvContent);
  }
}
