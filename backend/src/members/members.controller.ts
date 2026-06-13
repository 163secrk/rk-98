import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MembersService } from './members.service';
import { RegisterMemberDto, RechargeDto, UpdateMemberDto, PurchasePackageDto, SettleOrderDto, DeductionPriority } from './dto/member.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { MemberLevel } from '../entities/member.entity';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('register')
  register(@Body() registerMemberDto: RegisterMemberDto) {
    return this.membersService.register(registerMemberDto);
  }

  @Post('recharge')
  recharge(@Body() rechargeDto: RechargeDto, @Request() req: any) {
    return this.membersService.recharge(rechargeDto, req.user);
  }

  @Post('purchase-package')
  purchasePackage(@Body() dto: PurchasePackageDto, @Request() req: any) {
    return this.membersService.purchasePackage(dto, req.user);
  }

  @Post('settle-order')
  settleOrder(@Body() dto: SettleOrderDto, @Request() req: any) {
    return this.membersService.settleOrder(
      dto.memberId,
      dto.orderId,
      req.user,
      dto.priority || DeductionPriority.PACKAGE_FIRST,
    );
  }

  @Get('stats')
  getStats() {
    return this.membersService.getMemberStats();
  }

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('level') level?: MemberLevel,
    @Query('isActive') isActive?: string,
  ) {
    return this.membersService.findAll({
      keyword,
      level,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.membersService.findByPhone(phone);
  }

  @Get('member-no/:memberNo')
  findByMemberNo(@Param('memberNo') memberNo: string) {
    return this.membersService.findByMemberNo(memberNo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Get(':id/recharge-records')
  getRechargeRecords(@Param('id') id: string) {
    return this.membersService.getRechargeRecords(id);
  }

  @Get(':id/deduction-records')
  getDeductionRecords(@Param('id') id: string) {
    return this.membersService.getDeductionRecords(id);
  }

  @Get(':id/member-packages')
  getMemberPackages(@Param('id') id: string) {
    return this.membersService.getMemberPackages(id);
  }
}
