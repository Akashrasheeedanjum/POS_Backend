import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BusinessReportsService } from './business-reports.service';

@ApiTags('business-reports')
@Controller('business-reports')
export class BusinessReportsController {
  constructor(private readonly businessReportsService: BusinessReportsService) {}

  @Get('sales-summary')
  @ApiOperation({ summary: 'Daily or monthly sales summary in PKR (Pakistan)' })
  @ApiQuery({ name: 'period', required: false, example: '2026-07' })
  @ApiQuery({ name: 'date', required: false, example: '05/07/2026' })
  getSalesSummary(@Query('period') period?: string, @Query('date') date?: string) {
    return this.businessReportsService.getSalesSummary({ period, date });
  }

  @Get('purchase-summary')
  @ApiOperation({ summary: 'Daily or monthly scrap purchase summary in PKR' })
  @ApiQuery({ name: 'period', required: false, example: '2026-07' })
  @ApiQuery({ name: 'date', required: false, example: '05/07/2026' })
  getPurchaseSummary(@Query('period') period?: string, @Query('date') date?: string) {
    return this.businessReportsService.getPurchaseSummary({ period, date });
  }

  @Get('daily-pnl')
  @ApiOperation({ summary: 'Daily PNL: sales profit minus scrap purchases (PKR)' })
  @ApiQuery({ name: 'period', required: false, example: '2026-07' })
  @ApiQuery({ name: 'date', required: false, example: '05/07/2026' })
  getDailyPnl(@Query('period') period?: string, @Query('date') date?: string) {
    return this.businessReportsService.getDailyPnl({ period, date });
  }

  @Get('purchase-journal')
  @ApiOperation({ summary: 'Scrap purchase journal with supplier details' })
  @ApiQuery({ name: 'period', required: false, example: '2026-07' })
  @ApiQuery({ name: 'date', required: false, example: '05/07/2026' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPurchaseJournal(
    @Query('period') period?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.businessReportsService.getPurchaseJournal(
      { period, date },
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
