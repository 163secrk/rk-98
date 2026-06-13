import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Consumable, ConsumableStatus, ConsumableType } from '../entities/consumable.entity';
import {
  ConsumableRecord,
  ConsumableRecordType,
  ConsumeSource,
} from '../entities/consumable-record.entity';
import { Staff } from '../entities/staff.entity';
import {
  CreateConsumableDto,
  UpdateConsumableDto,
  InboundConsumableDto,
  ConsumeConsumableDto,
  AdjustConsumableDto,
} from './dto/consumable.dto';

@Injectable()
export class ConsumablesService {
  constructor(
    @InjectRepository(Consumable)
    private readonly consumableRepository: Repository<Consumable>,
    @InjectRepository(ConsumableRecord)
    private readonly consumableRecordRepository: Repository<ConsumableRecord>,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateConsumableDto, operator?: Staff): Promise<Consumable> {
    const existing = await this.consumableRepository.findOne({
      where: { name: createDto.name, storeId: createDto.storeId },
    });
    if (existing) {
      throw new BadRequestException('该门店已存在同名耗材');
    }

    const consumable = this.consumableRepository.create({
      ...createDto,
      stock: createDto.stock || 0,
    });
    const saved = await this.consumableRepository.save(consumable);

    if (createDto.stock && createDto.stock > 0) {
      const record = this.consumableRecordRepository.create({
        consumableId: saved.id,
        recordType: ConsumableRecordType.INBOUND,
        quantity: createDto.stock,
        stockAfter: createDto.stock,
        operatorId: operator?.id,
        remark: '初始库存',
      });
      await this.consumableRecordRepository.save(record);
    }

    return saved;
  }

  async findAll(query: { storeId?: string; type?: ConsumableType; keyword?: string } = {}): Promise<Consumable[]> {
    const qb = this.consumableRepository
      .createQueryBuilder('consumable')
      .leftJoinAndSelect('consumable.store', 'store')
      .orderBy('consumable.createdAt', 'DESC');

    if (query.storeId) {
      qb.andWhere('consumable.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.type) {
      qb.andWhere('consumable.type = :type', { type: query.type });
    }
    if (query.keyword) {
      qb.andWhere('consumable.name LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Consumable> {
    const consumable = await this.consumableRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!consumable) {
      throw new NotFoundException('耗材不存在');
    }
    return consumable;
  }

  async update(id: string, updateDto: UpdateConsumableDto): Promise<Consumable> {
    const consumable = await this.findOne(id);

    if (updateDto.name && updateDto.name !== consumable.name) {
      const existing = await this.consumableRepository.findOne({
        where: { name: updateDto.name, storeId: consumable.storeId },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('该门店已存在同名耗材');
      }
    }

    Object.assign(consumable, updateDto);
    return this.consumableRepository.save(consumable);
  }

  async remove(id: string): Promise<void> {
    const consumable = await this.findOne(id);
    consumable.status = ConsumableStatus.INACTIVE;
    await this.consumableRepository.save(consumable);
  }

  async inbound(id: string, inboundDto: InboundConsumableDto, operator?: Staff): Promise<Consumable> {
    return this.dataSource.transaction(async (manager) => {
      const consumable = await manager.findOne(Consumable, { where: { id } });
      if (!consumable) {
        throw new NotFoundException('耗材不存在');
      }

      const newStock = Number(consumable.stock) + Number(inboundDto.quantity);
      consumable.stock = newStock;
      await manager.save(consumable);

      const record = manager.create(ConsumableRecord, {
        consumableId: id,
        recordType: ConsumableRecordType.INBOUND,
        quantity: inboundDto.quantity,
        stockAfter: newStock,
        operatorId: operator?.id,
        batchNo: inboundDto.batchNo,
        unitCost: inboundDto.unitCost,
        remark: inboundDto.remark,
      });
      await manager.save(record);

      return consumable;
    });
  }

  async consume(id: string, consumeDto: ConsumeConsumableDto, operator?: Staff): Promise<Consumable> {
    return this.dataSource.transaction(async (manager) => {
      const consumable = await manager.findOne(Consumable, { where: { id } });
      if (!consumable) {
        throw new NotFoundException('耗材不存在');
      }

      if (Number(consumable.stock) < Number(consumeDto.quantity)) {
        throw new BadRequestException('库存不足');
      }

      const newStock = Number(consumable.stock) - Number(consumeDto.quantity);
      consumable.stock = newStock;
      await manager.save(consumable);

      const record = manager.create(ConsumableRecord, {
        consumableId: id,
        recordType: ConsumableRecordType.CONSUME,
        quantity: consumeDto.quantity,
        stockAfter: newStock,
        operatorId: operator?.id,
        consumeSource: ConsumeSource.MANUAL,
        remark: consumeDto.remark,
      });
      await manager.save(record);

      return consumable;
    });
  }

  async adjust(id: string, adjustDto: AdjustConsumableDto, operator?: Staff): Promise<Consumable> {
    return this.dataSource.transaction(async (manager) => {
      const consumable = await manager.findOne(Consumable, { where: { id } });
      if (!consumable) {
        throw new NotFoundException('耗材不存在');
      }

      const oldStock = Number(consumable.stock);
      consumable.stock = adjustDto.stock;
      await manager.save(consumable);

      const diff = Number(adjustDto.stock) - oldStock;
      const recordType = diff >= 0 ? ConsumableRecordType.INBOUND : ConsumableRecordType.CONSUME;

      const record = manager.create(ConsumableRecord, {
        consumableId: id,
        recordType,
        quantity: Math.abs(diff),
        stockAfter: adjustDto.stock,
        operatorId: operator?.id,
        remark: `库存调整${adjustDto.remark ? '：' + adjustDto.remark : ''}`,
      });
      await manager.save(record);

      return consumable;
    });
  }

  async getRecords(query: {
    consumableId?: string;
    storeId?: string;
    recordType?: ConsumableRecordType;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ConsumableRecord[]> {
    const qb = this.consumableRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.consumable', 'consumable')
      .leftJoinAndSelect('record.operator', 'operator')
      .leftJoinAndSelect('record.order', 'order')
      .orderBy('record.createdAt', 'DESC');

    if (query.consumableId) {
      qb.andWhere('record.consumableId = :consumableId', { consumableId: query.consumableId });
    }
    if (query.storeId) {
      qb.andWhere('consumable.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.recordType) {
      qb.andWhere('record.recordType = :recordType', { recordType: query.recordType });
    }
    if (query.startDate) {
      qb.andWhere('DATE(record.createdAt) >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('DATE(record.createdAt) <= :endDate', { endDate: query.endDate });
    }

    const records = await qb.getMany();
    return records.map((r) => {
      if (r.operator) {
        delete r.operator.password;
      }
      return r;
    });
  }

  async getLowStockAlerts(storeId?: string): Promise<Consumable[]> {
    const qb = this.consumableRepository
      .createQueryBuilder('consumable')
      .leftJoinAndSelect('consumable.store', 'store')
      .where('consumable.status = :status', { status: ConsumableStatus.ACTIVE })
      .andWhere('consumable.stock <= consumable.threshold')
      .andWhere('consumable.threshold > 0')
      .orderBy('consumable.stock', 'ASC');

    if (storeId) {
      qb.andWhere('consumable.storeId = :storeId', { storeId });
    }

    return qb.getMany();
  }

  async getRecommendedConsumables(storeId: string, totalItems: number) {
    const consumables = await this.consumableRepository.find({
      where: { storeId, status: ConsumableStatus.ACTIVE },
    });

    return consumables.map((consumable) => {
      let recommendedQuantity = 0;

      if (consumable.name.includes('洗衣液') || consumable.name.includes('洗涤剂')) {
        recommendedQuantity = totalItems * 0.05;
      } else if (consumable.name.includes('柔顺剂')) {
        recommendedQuantity = totalItems * 0.03;
      } else if (consumable.name.includes('去渍剂')) {
        recommendedQuantity = Math.ceil(totalItems * 0.1);
      } else if (consumable.name.includes('衣架')) {
        recommendedQuantity = totalItems;
      } else if (consumable.name.includes('洗衣袋')) {
        recommendedQuantity = Math.ceil(totalItems * 0.5);
      }

      return {
        consumableId: consumable.id,
        consumableName: consumable.name,
        unit: consumable.unit,
        stock: consumable.stock,
        recommendedQuantity: Number(recommendedQuantity.toFixed(2)),
        type: consumable.type,
      };
    });
  }

  async consumeByOrderConfig(
    orderId: string,
    storeId: string,
    consumables: Array<{ consumableId: string; consumableName: string; quantity: number; unit?: string }>,
    source: ConsumeSource,
    operator?: Staff,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(ConsumableRecord, {
        where: { orderId, consumeSource: source, recordType: ConsumableRecordType.CONSUME },
      });
      if (existing) {
        throw new BadRequestException('该订单已执行过耗材出库');
      }

      for (const item of consumables) {
        if (item.quantity <= 0) continue;

        const consumable = await manager.findOne(Consumable, {
          where: { id: item.consumableId, storeId },
        });
        if (!consumable) {
          throw new BadRequestException(`耗材「${item.consumableName}」不存在`);
        }

        if (Number(consumable.stock) < Number(item.quantity)) {
          throw new BadRequestException(`耗材「${consumable.name}」库存不足，当前库存：${consumable.stock}${consumable.unit}`);
        }

        const newStock = Number(consumable.stock) - Number(item.quantity);
        consumable.stock = newStock;
        await manager.save(consumable);

        const record = manager.create(ConsumableRecord, {
          consumableId: consumable.id,
          recordType: ConsumableRecordType.CONSUME,
          quantity: item.quantity,
          stockAfter: newStock,
          operatorId: operator?.id,
          orderId,
          consumeSource: source,
          remark: `${source === ConsumeSource.WASH ? '洗涤' : '烘干'}订单耗材出库`,
        });
        await manager.save(record);
      }
    });
  }

  async returnByOrder(
    orderId: string,
    storeId: string,
    operator?: Staff,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(ConsumableRecord, {
        where: { orderId, recordType: ConsumableRecordType.RETURN },
      });
      if (existing) {
        return;
      }

      const consumedRecords = await manager.find(ConsumableRecord, {
        where: {
          orderId,
          recordType: ConsumableRecordType.CONSUME,
        },
        relations: ['consumable'],
      });

      for (const record of consumedRecords) {
        if (!record.consumable) continue;

        if (record.consumable.type === ConsumableType.RECYCLABLE) {
          const consumable = await manager.findOne(Consumable, {
            where: { id: record.consumableId },
          });
          if (!consumable) continue;

          const returnAmount = Number(record.quantity);
          const newStock = Number(consumable.stock) + returnAmount;
          consumable.stock = newStock;
          await manager.save(consumable);

          const returnRecord = manager.create(ConsumableRecord, {
            consumableId: consumable.id,
            recordType: ConsumableRecordType.RETURN,
            quantity: returnAmount,
            stockAfter: newStock,
            operatorId: operator?.id,
            orderId,
            consumeSource: record.consumeSource,
            remark: `订单完成归还入库`,
          });
          await manager.save(returnRecord);
        }
      }
    });
  }

  async getOrderConsumableRecords(orderId: string): Promise<ConsumableRecord[]> {
    const records = await this.consumableRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.consumable', 'consumable')
      .leftJoinAndSelect('record.operator', 'operator')
      .where('record.orderId = :orderId', { orderId })
      .orderBy('record.createdAt', 'ASC')
      .getMany();

    return records.map((r) => {
      if (r.operator) {
        delete r.operator.password;
      }
      return r;
    });
  }

  async initDefaultData() {
    const stores = await this.consumableRepository.query('SELECT id FROM stores LIMIT 1');
    if (stores.length === 0) return;

    const count = await this.consumableRepository.count();
    if (count > 0) return;

    const storeId = stores[0].id;

    const defaults = [
      {
        name: '洗衣液',
        type: ConsumableType.NON_RECYCLABLE,
        unit: 'L',
        stock: 50,
        threshold: 10,
        unitPrice: 25,
        specification: '5L/桶',
        remark: '普通洗衣液',
      },
      {
        name: '衣架',
        type: ConsumableType.RECYCLABLE,
        unit: '个',
        stock: 200,
        threshold: 50,
        unitPrice: 2,
        specification: '标准塑料衣架',
        remark: '可回收重复使用',
      },
      {
        name: '柔顺剂',
        type: ConsumableType.NON_RECYCLABLE,
        unit: 'L',
        stock: 30,
        threshold: 5,
        unitPrice: 30,
        specification: '4L/桶',
        remark: '衣物柔顺剂',
      },
      {
        name: '去渍剂',
        type: ConsumableType.NON_RECYCLABLE,
        unit: '瓶',
        stock: 20,
        threshold: 5,
        unitPrice: 45,
        specification: '500ml/瓶',
        remark: '强力去渍剂',
      },
      {
        name: '洗衣袋',
        type: ConsumableType.RECYCLABLE,
        unit: '个',
        stock: 100,
        threshold: 20,
        unitPrice: 5,
        specification: '大号网袋',
        remark: '可回收重复使用',
      },
    ];

    for (const item of defaults) {
      const entity = this.consumableRepository.create({
        ...item,
        storeId,
      });
      const saved = await this.consumableRepository.save(entity);

      const record = this.consumableRecordRepository.create({
        consumableId: saved.id,
        recordType: ConsumableRecordType.INBOUND,
        quantity: item.stock,
        stockAfter: item.stock,
        remark: '初始库存',
      });
      await this.consumableRecordRepository.save(record);
    }

    console.log('Default consumables created');
  }
}
