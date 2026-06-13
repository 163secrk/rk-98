import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ConsumablesService } from './consumables.service';
import {
  CreateConsumableDto,
  UpdateConsumableDto,
  InboundConsumableDto,
  ConsumeConsumableDto,
  AdjustConsumableDto,
} from './dto/consumable.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/staff.entity';
import { ConsumableType } from '../entities/consumable.entity';
import { ConsumableRecordType } from '../entities/consumable-record.entity';

@Controller('consumables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createDto: CreateConsumableDto, @Req() req: any) {
    return this.consumablesService.create(createDto, req.user);
  }

  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('type') type?: ConsumableType,
    @Query('keyword') keyword?: string,
  ) {
    return this.consumablesService.findAll({ storeId, type, keyword });
  }

  @Get('alerts/low-stock')
  getLowStockAlerts(@Query('storeId') storeId?: string) {
    return this.consumablesService.getLowStockAlerts(storeId);
  }

  @Get('records')
  getRecords(
    @Query('consumableId') consumableId?: string,
    @Query('storeId') storeId?: string,
    @Query('recordType') recordType?: ConsumableRecordType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.consumablesService.getRecords({
      consumableId,
      storeId,
      recordType,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consumablesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateDto: UpdateConsumableDto) {
    return this.consumablesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.consumablesService.remove(id);
  }

  @Post(':id/inbound')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  inbound(
    @Param('id') id: string,
    @Body() inboundDto: InboundConsumableDto,
    @Req() req: any,
  ) {
    return this.consumablesService.inbound(id, inboundDto, req.user);
  }

  @Post(':id/consume')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  consume(
    @Param('id') id: string,
    @Body() consumeDto: ConsumeConsumableDto,
    @Req() req: any,
  ) {
    return this.consumablesService.consume(id, consumeDto, req.user);
  }

  @Post(':id/adjust')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  adjust(
    @Param('id') id: string,
    @Body() adjustDto: AdjustConsumableDto,
    @Req() req: any,
  ) {
    return this.consumablesService.adjust(id, adjustDto, req.user);
  }

  @Get('recommended/wash')
  getRecommendedConsumables(
    @Query('storeId') storeId: string,
    @Query('totalItems') totalItems: number,
  ) {
    return this.consumablesService.getRecommendedConsumables(storeId, Number(totalItems));
  }

  @Get('order/:orderId/records')
  getOrderConsumableRecords(@Param('orderId') orderId: string) {
    return this.consumablesService.getOrderConsumableRecords(orderId);
  }
}
