import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Member, MemberLevel } from '../entities/member.entity';
import { Customer } from '../entities/customer.entity';
import { RechargeRecord, RechargeType } from '../entities/recharge-record.entity';
import { Staff } from '../entities/staff.entity';
import { Package, PackageStatus } from '../entities/package.entity';
import { MemberPackage, MemberPackageStatus } from '../entities/member-package.entity';
import { DeductionRecord, DeductionType } from '../entities/deduction-record.entity';
import { Order } from '../entities/order.entity';
import { RegisterMemberDto, RechargeDto, UpdateMemberDto, RechargeBonusRule, PurchasePackageDto, DeductionPriority } from './dto/member.dto';

export interface DeductItem {
  clothingTypeId: string;
  quantity: number;
  unitPrice: number;
}

export interface DeductResult {
  totalPackageUsed: number;
  totalBalanceUsed: number;
  deductionRecords: DeductionRecord[];
}

@Injectable()
export class MembersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(RechargeRecord)
    private readonly rechargeRecordRepository: Repository<RechargeRecord>,
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
    @InjectRepository(MemberPackage)
    private readonly memberPackageRepository: Repository<MemberPackage>,
    @InjectRepository(DeductionRecord)
    private readonly deductionRecordRepository: Repository<DeductionRecord>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  private generateMemberNo(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(100000 + Math.random() * 900000);
    return `VIP${dateStr}${random}`;
  }

  private calculateLevel(totalRecharged: number): MemberLevel {
    if (totalRecharged >= 10000) return MemberLevel.PLATINUM;
    if (totalRecharged >= 5000) return MemberLevel.GOLD;
    if (totalRecharged >= 1000) return MemberLevel.SILVER;
    return MemberLevel.NORMAL;
  }

  async register(dto: RegisterMemberDto): Promise<Member> {
    let customer = await this.customerRepository.findOne({
      where: { phone: dto.phone },
    });

    if (customer) {
      const existingMember = await this.memberRepository.findOne({
        where: { customerId: customer.id },
      });
      if (existingMember) {
        throw new ConflictException('该手机号已注册会员');
      }
      customer.name = dto.name || customer.name;
      customer.address = dto.address || customer.address;
      customer.remark = dto.remark || customer.remark;
      customer = await this.customerRepository.save(customer);
    } else {
      customer = this.customerRepository.create({
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        remark: dto.remark,
      });
      customer = await this.customerRepository.save(customer);
    }

    const member = this.memberRepository.create({
      memberNo: this.generateMemberNo(),
      customerId: customer.id,
      balance: 0,
      totalRecharged: 0,
      totalBonus: 0,
      level: MemberLevel.NORMAL,
      isActive: true,
    });

    return this.memberRepository.save(member);
  }

  async recharge(dto: RechargeDto, staff?: Staff): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id: dto.memberId },
    });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    if (!member.isActive) {
      throw new BadRequestException('会员账号已停用');
    }

    const bonusAmount = RechargeBonusRule.calculateBonus(dto.amount);
    const totalAdd = Number(dto.amount) + Number(bonusAmount);

    member.balance = Number(member.balance) + totalAdd;
    member.totalRecharged = Number(member.totalRecharged) + Number(dto.amount);
    member.totalBonus = Number(member.totalBonus) + Number(bonusAmount);
    member.level = this.calculateLevel(Number(member.totalRecharged));

    await this.memberRepository.save(member);

    const record = this.rechargeRecordRepository.create({
      memberId: member.id,
      staffId: staff?.id,
      amount: dto.amount,
      bonusAmount,
      payType: dto.payType || RechargeType.CASH,
      remark: dto.remark || (bonusAmount > 0 ? `充值${dto.amount}元，赠送${bonusAmount}元` : undefined),
    });
    await this.rechargeRecordRepository.save(record);

    return member;
  }

  async purchasePackage(dto: PurchasePackageDto, staff?: Staff): Promise<MemberPackage> {
    const member = await this.memberRepository.findOne({
      where: { id: dto.memberId },
    });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    if (!member.isActive) {
      throw new BadRequestException('会员账号已停用');
    }

    const pkg = await this.packageRepository.findOne({
      where: { id: dto.packageId, status: PackageStatus.ACTIVE },
    });
    if (!pkg) {
      throw new NotFoundException('套餐不存在或已下架');
    }

    if (Number(member.balance) < Number(pkg.price)) {
      throw new BadRequestException('会员余额不足，请先充值');
    }

    return await this.dataSource.transaction(async (manager) => {
      member.balance = Number(member.balance) - Number(pkg.price);
      await manager.save(member);

      const expireDate = pkg.validDays
        ? new Date(Date.now() + pkg.validDays * 24 * 60 * 60 * 1000)
        : null;

      const memberPackage = manager.create(MemberPackage, {
        memberId: member.id,
        packageId: pkg.id,
        staffId: staff?.id,
        totalCount: pkg.totalCount,
        usedCount: 0,
        remainingCount: pkg.totalCount,
        purchasePrice: pkg.price,
        status: MemberPackageStatus.ACTIVE,
        expireDate,
      });

      const savedMemberPackage = await manager.save(memberPackage);

      const deductionRecord = manager.create(DeductionRecord, {
        memberId: member.id,
        orderId: null,
        orderItemId: null,
        memberPackageId: null,
        staffId: staff?.id,
        deductionType: DeductionType.BALANCE,
        packageCountUsed: 0,
        balanceUsed: pkg.price,
        remark: `购买套餐：${pkg.name}`,
      });
      await manager.save(deductionRecord);

      return savedMemberPackage;
    });
  }

  async deductForOrder(
    memberId: string,
    orderId: string,
    items: DeductItem[],
    staff?: Staff,
    priority: DeductionPriority = DeductionPriority.PACKAGE_FIRST,
  ): Promise<DeductResult> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['memberPackages', 'memberPackages.package'],
    });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    if (!member.isActive) {
      throw new BadRequestException('会员账号已停用');
    }

    return await this.dataSource.transaction(async (manager) => {
      const deductionRecords: DeductionRecord[] = [];
      let totalPackageUsed = 0;
      let totalBalanceUsed = 0;

      const activePackages = member.memberPackages.filter(
        (mp) =>
          mp.status === MemberPackageStatus.ACTIVE &&
          mp.remainingCount > 0 &&
          (!mp.expireDate || mp.expireDate > new Date()),
      );

      for (const item of items) {
        let remainingQty = item.quantity;

        if (priority === DeductionPriority.PACKAGE_FIRST || priority === DeductionPriority.PACKAGE_ONLY) {
          const matchingPackages = activePackages.filter(
            (mp) => mp.package.clothingTypeId === item.clothingTypeId,
          );

          for (const mp of matchingPackages) {
            if (remainingQty <= 0) break;
            if (mp.remainingCount <= 0) continue;

            const useCount = Math.min(remainingQty, mp.remainingCount);
            mp.usedCount += useCount;
            mp.remainingCount -= useCount;

            if (mp.remainingCount === 0) {
              mp.status = MemberPackageStatus.USED_UP;
            }

            await manager.save(mp);

            const record = manager.create(DeductionRecord, {
              memberId: member.id,
              orderId,
              memberPackageId: mp.id,
              staffId: staff?.id,
              deductionType: DeductionType.PACKAGE,
              packageCountUsed: useCount,
              balanceUsed: 0,
              remark: `套餐核销：${mp.package.name}`,
            });
            const savedRecord = await manager.save(record);
            deductionRecords.push(savedRecord);

            totalPackageUsed += useCount;
            remainingQty -= useCount;
          }

          if (remainingQty > 0 && priority !== DeductionPriority.PACKAGE_ONLY) {
            const balanceCost = remainingQty * Number(item.unitPrice);
            if (Number(member.balance) < balanceCost) {
              throw new BadRequestException(
                `余额不足，还需 ¥${balanceCost.toFixed(2)}，当前余额 ¥${Number(member.balance).toFixed(2)}`,
              );
            }

            member.balance = Number(member.balance) - balanceCost;
            await manager.save(member);

            const record = manager.create(DeductionRecord, {
              memberId: member.id,
              orderId,
              memberPackageId: null,
              staffId: staff?.id,
              deductionType: DeductionType.BALANCE,
              packageCountUsed: 0,
              balanceUsed: balanceCost,
              remark: `余额抵扣：${remainingQty}件，单价¥${item.unitPrice}`,
            });
            const savedRecord = await manager.save(record);
            deductionRecords.push(savedRecord);

            totalBalanceUsed += balanceCost;
            remainingQty = 0;
          }
        } else if (priority === DeductionPriority.BALANCE_FIRST || priority === DeductionPriority.BALANCE_ONLY) {
          const balanceCost = remainingQty * Number(item.unitPrice);

          if (priority === DeductionPriority.BALANCE_ONLY || Number(member.balance) >= balanceCost) {
            if (Number(member.balance) < balanceCost) {
              throw new BadRequestException(
                `余额不足，还需 ¥${balanceCost.toFixed(2)}，当前余额 ¥${Number(member.balance).toFixed(2)}`,
              );
            }

            member.balance = Number(member.balance) - balanceCost;
            await manager.save(member);

            const record = manager.create(DeductionRecord, {
              memberId: member.id,
              orderId,
              memberPackageId: null,
              staffId: staff?.id,
              deductionType: DeductionType.BALANCE,
              packageCountUsed: 0,
              balanceUsed: balanceCost,
              remark: `余额抵扣：${remainingQty}件，单价¥${item.unitPrice}`,
            });
            const savedRecord = await manager.save(record);
            deductionRecords.push(savedRecord);

            totalBalanceUsed += balanceCost;
            remainingQty = 0;
          } else {
            const partialBalance = Number(member.balance);
            const partialQty = Math.floor(partialBalance / Number(item.unitPrice));

            if (partialQty > 0) {
              member.balance = Number(member.balance) - partialQty * Number(item.unitPrice);
              await manager.save(member);

              const record = manager.create(DeductionRecord, {
                memberId: member.id,
                orderId,
                memberPackageId: null,
                staffId: staff?.id,
                deductionType: DeductionType.BALANCE,
                packageCountUsed: 0,
                balanceUsed: partialQty * Number(item.unitPrice),
                remark: `余额抵扣：${partialQty}件，单价¥${item.unitPrice}`,
              });
              const savedRecord = await manager.save(record);
              deductionRecords.push(savedRecord);

              totalBalanceUsed += partialQty * Number(item.unitPrice);
              remainingQty -= partialQty;
            }

            const matchingPackages = activePackages.filter(
              (mp) => mp.package.clothingTypeId === item.clothingTypeId,
            );

            for (const mp of matchingPackages) {
              if (remainingQty <= 0) break;
              if (mp.remainingCount <= 0) continue;

              const useCount = Math.min(remainingQty, mp.remainingCount);
              mp.usedCount += useCount;
              mp.remainingCount -= useCount;

              if (mp.remainingCount === 0) {
                mp.status = MemberPackageStatus.USED_UP;
              }

              await manager.save(mp);

              const record = manager.create(DeductionRecord, {
                memberId: member.id,
                orderId,
                memberPackageId: mp.id,
                staffId: staff?.id,
                deductionType: DeductionType.PACKAGE,
                packageCountUsed: useCount,
                balanceUsed: 0,
                remark: `套餐核销：${mp.package.name}`,
              });
              const savedRecord = await manager.save(record);
              deductionRecords.push(savedRecord);

              totalPackageUsed += useCount;
              remainingQty -= useCount;
            }
          }
        }

        if (remainingQty > 0) {
          throw new BadRequestException(
            `衣物 ${item.clothingTypeId} 核销失败：套餐次数和余额均不足以支付剩余 ${remainingQty} 件`,
          );
        }
      }

      return {
        totalPackageUsed,
        totalBalanceUsed,
        deductionRecords,
      };
    });
  }

  async settleOrder(
    memberId: string,
    orderId: string,
    staff?: Staff,
    priority: DeductionPriority = DeductionPriority.PACKAGE_FIRST,
  ): Promise<DeductResult> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const existingDeduction = await this.deductionRecordRepository.findOne({
      where: { memberId, orderId },
    });
    if (existingDeduction) {
      throw new BadRequestException('该订单已核销，不可重复核销');
    }

    const items: DeductItem[] = order.items.map((item) => ({
      clothingTypeId: item.clothingTypeId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    }));

    const result = await this.deductForOrder(memberId, orderId, items, staff, priority);

    const totalDeducted = result.totalPackageUsed > 0
      ? order.totalAmount
      : result.totalBalanceUsed;
    order.paidAmount = totalDeducted;
    await this.orderRepository.save(order);

    return result;
  }

  async getMemberStats() {
    const totalMembers = await this.memberRepository.count();
    const activeMembers = await this.memberRepository.count({ where: { isActive: true } });

    const balanceResult = await this.memberRepository
      .createQueryBuilder('member')
      .select('SUM(member.balance)', 'totalBalance')
      .getRawOne();

    const rechargedResult = await this.memberRepository
      .createQueryBuilder('member')
      .select('SUM(member.totalRecharged)', 'totalRecharged')
      .getRawOne();

    const activePackages = await this.memberPackageRepository.count({
      where: { status: MemberPackageStatus.ACTIVE },
    });

    return {
      totalMembers,
      activeMembers,
      totalBalance: Number(balanceResult?.totalBalance || 0),
      totalRecharged: Number(rechargedResult?.totalRecharged || 0),
      activePackages,
    };
  }

  async findAll(query: { keyword?: string; level?: MemberLevel; isActive?: boolean } = {}): Promise<Member[]> {
    const qb = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.customer', 'customer')
      .leftJoinAndSelect('member.memberPackages', 'memberPackages')
      .leftJoinAndSelect('memberPackages.package', 'pkg')
      .orderBy('member.createdAt', 'DESC');

    if (query.keyword) {
      qb.andWhere(
        '(member.memberNo LIKE :keyword OR customer.name LIKE :keyword OR customer.phone LIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }
    if (query.level) {
      qb.andWhere('member.level = :level', { level: query.level });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('member.isActive = :isActive', { isActive: query.isActive });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['customer', 'memberPackages', 'memberPackages.package', 'rechargeRecords'],
    });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    return member;
  }

  async findByPhone(phone: string): Promise<Member> {
    const customer = await this.customerRepository.findOne({ where: { phone } });
    if (!customer) {
      throw new NotFoundException('该手机号未注册会员');
    }
    const member = await this.memberRepository.findOne({
      where: { customerId: customer.id },
      relations: ['customer', 'memberPackages', 'memberPackages.package'],
    });
    if (!member) {
      throw new NotFoundException('该手机号未注册会员');
    }
    return member;
  }

  async findByMemberNo(memberNo: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { memberNo },
      relations: ['customer', 'memberPackages', 'memberPackages.package'],
    });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }
    return member;
  }

  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    if (dto.name || dto.phone || dto.address || dto.remark) {
      const customer = member.customer;
      if (dto.name) customer.name = dto.name;
      if (dto.phone) customer.phone = dto.phone;
      if (dto.address) customer.address = dto.address;
      if (dto.remark) customer.remark = dto.remark;
      await this.customerRepository.save(customer);
    }
    if (dto.level !== undefined) member.level = dto.level;
    if (dto.isActive !== undefined) member.isActive = dto.isActive;
    return this.memberRepository.save(member);
  }

  async getRechargeRecords(memberId: string): Promise<RechargeRecord[]> {
    return this.rechargeRecordRepository.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDeductionRecords(memberId: string): Promise<DeductionRecord[]> {
    return this.deductionRecordRepository.find({
      where: { memberId },
      relations: ['memberPackage', 'memberPackage.package'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMemberPackages(memberId: string): Promise<MemberPackage[]> {
    const member = await this.findOne(memberId);
    return member.memberPackages || [];
  }
}
