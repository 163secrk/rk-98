import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { RechargeRecord } from '../entities/recharge-record.entity';
import { MemberPackage } from '../entities/member-package.entity';
import { ConsumableRecord, ConsumableRecordType } from '../entities/consumable-record.entity';
import { Store } from '../entities/store.entity';
import { DailyReportQueryDto } from './dto/report.dto';

export interface StoreDailySummary {
  date: string;
  storeId: string;
  storeName: string;
  orderRevenue: number;
  rechargeAmount: number;
  packageAmount: number;
  consumableCost: number;
  netIncome: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(RechargeRecord)
    private readonly rechargeRecordRepository: Repository<RechargeRecord>,
    @InjectRepository(MemberPackage)
    private readonly memberPackageRepository: Repository<MemberPackage>,
    @InjectRepository(ConsumableRecord)
    private readonly consumableRecordRepository: Repository<ConsumableRecord>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async getDailyReport(query: DailyReportQueryDto): Promise<{
    list: StoreDailySummary[];
    totals: {
      orderRevenue: number;
      rechargeAmount: number;
      packageAmount: number;
      consumableCost: number;
      netIncome: number;
    };
  }> {
    const stores = await this.storeRepository.find();
    const storeMap = new Map(stores.map((s) => [s.id, s.name]));

    const { startDate, endDate, storeId } = query;

    const orderQb = this.orderRepository
      .createQueryBuilder('order')
      .select("DATE(order.createdAt)", 'date')
      .addSelect('order.storeId', 'storeId')
      .addSelect('SUM(order.paidAmount)', 'orderRevenue')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy("DATE(order.createdAt)")
      .addGroupBy('order.storeId');

    const rechargeQb = this.rechargeRecordRepository
      .createQueryBuilder('rr')
      .leftJoin('rr.staff', 'staff')
      .select("DATE(rr.createdAt)", 'date')
      .addSelect('staff.storeId', 'storeId')
      .addSelect('SUM(rr.amount)', 'rechargeAmount')
      .where('staff.storeId IS NOT NULL')
      .groupBy("DATE(rr.createdAt)")
      .addGroupBy('staff.storeId');

    const packageQb = this.memberPackageRepository
      .createQueryBuilder('mp')
      .leftJoin('mp.staff', 'staff')
      .select("DATE(mp.purchaseDate)", 'date')
      .addSelect('staff.storeId', 'storeId')
      .addSelect('SUM(mp.purchasePrice)', 'packageAmount')
      .where('staff.storeId IS NOT NULL')
      .groupBy("DATE(mp.purchaseDate)")
      .addGroupBy('staff.storeId');

    const consumableQb = this.consumableRecordRepository
      .createQueryBuilder('cr')
      .leftJoin('cr.order', 'order')
      .leftJoin('cr.operator', 'operator')
      .select("DATE(cr.createdAt)", 'date')
      .addSelect('COALESCE(order.storeId, operator.storeId)', 'storeId')
      .addSelect('SUM(cr.quantity * COALESCE(cr.unitCost, 0))', 'consumableCost')
      .where('cr.recordType = :consumeType', { consumeType: ConsumableRecordType.CONSUME })
      .andWhere('(order.storeId IS NOT NULL OR operator.storeId IS NOT NULL)')
      .groupBy("DATE(cr.createdAt)")
      .addGroupBy('COALESCE(order.storeId, operator.storeId)');

    if (startDate) {
      orderQb.andWhere('DATE(order.createdAt) >= :startDate', { startDate });
      rechargeQb.andWhere('DATE(rr.createdAt) >= :startDate', { startDate });
      packageQb.andWhere('DATE(mp.purchaseDate) >= :startDate', { startDate });
      consumableQb.andWhere('DATE(cr.createdAt) >= :startDate', { startDate });
    }
    if (endDate) {
      orderQb.andWhere('DATE(order.createdAt) <= :endDate', { endDate });
      rechargeQb.andWhere('DATE(rr.createdAt) <= :endDate', { endDate });
      packageQb.andWhere('DATE(mp.purchaseDate) <= :endDate', { endDate });
      consumableQb.andWhere('DATE(cr.createdAt) <= :endDate', { endDate });
    }
    if (storeId) {
      orderQb.andWhere('order.storeId = :storeId', { storeId });
      rechargeQb.andWhere('staff.storeId = :storeId', { storeId });
      packageQb.andWhere('staff.storeId = :storeId', { storeId });
      consumableQb.andWhere('(order.storeId = :storeId OR operator.storeId = :storeId)', { storeId });
    }

    const [orderResults, rechargeResults, packageResults, consumableResults] = await Promise.all([
      orderQb.getRawMany(),
      rechargeQb.getRawMany(),
      packageQb.getRawMany(),
      consumableQb.getRawMany(),
    ]);

    const summaryMap = new Map<string, StoreDailySummary>();

    const getKey = (date: string, storeId: string) => `${date}_${storeId}`;

    for (const row of orderResults) {
      const key = getKey(row.date, row.storeId);
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          date: row.date,
          storeId: row.storeId,
          storeName: storeMap.get(row.storeId) || '-',
          orderRevenue: 0,
          rechargeAmount: 0,
          packageAmount: 0,
          consumableCost: 0,
          netIncome: 0,
        });
      }
      summaryMap.get(key).orderRevenue = Number(row.orderRevenue) || 0;
    }

    for (const row of rechargeResults) {
      if (!row.storeId) continue;
      const key = getKey(row.date, row.storeId);
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          date: row.date,
          storeId: row.storeId,
          storeName: storeMap.get(row.storeId) || '-',
          orderRevenue: 0,
          rechargeAmount: 0,
          packageAmount: 0,
          consumableCost: 0,
          netIncome: 0,
        });
      }
      summaryMap.get(key).rechargeAmount = Number(row.rechargeAmount) || 0;
    }

    for (const row of packageResults) {
      if (!row.storeId) continue;
      const key = getKey(row.date, row.storeId);
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          date: row.date,
          storeId: row.storeId,
          storeName: storeMap.get(row.storeId) || '-',
          orderRevenue: 0,
          rechargeAmount: 0,
          packageAmount: 0,
          consumableCost: 0,
          netIncome: 0,
        });
      }
      summaryMap.get(key).packageAmount = Number(row.packageAmount) || 0;
    }

    for (const row of consumableResults) {
      if (!row.storeId) continue;
      const key = getKey(row.date, row.storeId);
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          date: row.date,
          storeId: row.storeId,
          storeName: storeMap.get(row.storeId) || '-',
          orderRevenue: 0,
          rechargeAmount: 0,
          packageAmount: 0,
          consumableCost: 0,
          netIncome: 0,
        });
      }
      summaryMap.get(key).consumableCost = Number(row.consumableCost) || 0;
    }

    const list = Array.from(summaryMap.values())
      .map((item) => ({
        ...item,
        netIncome: item.orderRevenue + item.rechargeAmount + item.packageAmount - item.consumableCost,
      }))
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.storeName.localeCompare(b.storeName);
      });

    const totals = list.reduce(
      (acc, item) => ({
        orderRevenue: acc.orderRevenue + item.orderRevenue,
        rechargeAmount: acc.rechargeAmount + item.rechargeAmount,
        packageAmount: acc.packageAmount + item.packageAmount,
        consumableCost: acc.consumableCost + item.consumableCost,
        netIncome: acc.netIncome + item.netIncome,
      }),
      {
        orderRevenue: 0,
        rechargeAmount: 0,
        packageAmount: 0,
        consumableCost: 0,
        netIncome: 0,
      }
    );

    return { list, totals };
  }

  async exportDailyReport(query: DailyReportQueryDto): Promise<string> {
    const { list, totals } = await this.getDailyReport(query);

    const headers = ['日期', '门店', '订单实收(元)', '会员充值(元)', '套餐购买(元)', '耗材成本(元)', '净收入(元)'];
    const rows = list.map((item) => [
      item.date,
      item.storeName,
      item.orderRevenue.toFixed(2),
      item.rechargeAmount.toFixed(2),
      item.packageAmount.toFixed(2),
      item.consumableCost.toFixed(2),
      item.netIncome.toFixed(2),
    ]);
    rows.push([
      '合计',
      '',
      totals.orderRevenue.toFixed(2),
      totals.rechargeAmount.toFixed(2),
      totals.packageAmount.toFixed(2),
      totals.consumableCost.toFixed(2),
      totals.netIncome.toFixed(2),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return '\uFEFF' + csvContent;
  }
}
