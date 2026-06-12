import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { OrderStatus } from '../entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('status') status?: OrderStatus,
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAll({ storeId, status, keyword, startDate, endDate });
  }

  @Get('stats/summary')
  getStats(
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getStats({ storeId, startDate, endDate });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('no/:orderNo')
  findByOrderNo(@Param('orderNo') orderNo: string) {
    return this.ordersService.findByOrderNo(orderNo);
  }

  @Get(':id/voucher')
  getVoucher(@Param('id') id: string) {
    return this.ordersService.generateVoucher(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
