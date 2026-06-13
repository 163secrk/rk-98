import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Consumable } from './consumable.entity';
import { Staff } from './staff.entity';
import { Order } from './order.entity';

export enum ConsumableRecordType {
  INBOUND = 'inbound',
  CONSUME = 'consume',
  RETURN = 'return',
  ADJUST = 'adjust',
}

export enum ConsumeSource {
  WASH = 'wash',
  DRY = 'dry',
  MANUAL = 'manual',
}

@Entity('consumable_records')
export class ConsumableRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  consumableId: string;

  @ManyToOne(() => Consumable, (consumable) => consumable.records)
  @JoinColumn({ name: 'consumableId' })
  consumable: Consumable;

  @Column({
    type: 'simple-enum',
    enum: ConsumableRecordType,
  })
  recordType: ConsumableRecordType;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stockAfter: number;

  @Column({ nullable: true })
  operatorId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'operatorId' })
  operator: Staff;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({
    type: 'simple-enum',
    enum: ConsumeSource,
    nullable: true,
  })
  consumeSource: ConsumeSource;

  @Column({ nullable: true })
  batchNo: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}
