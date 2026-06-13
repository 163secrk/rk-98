import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { MemberPackage } from './member-package.entity';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Staff } from './staff.entity';

export enum DeductionType {
  PACKAGE = 'package',
  BALANCE = 'balance',
}

@Entity('deduction_records')
export class DeductionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  orderItemId: string;

  @ManyToOne(() => OrderItem, { nullable: true })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @Column({ nullable: true })
  memberPackageId: string;

  @ManyToOne(() => MemberPackage, { nullable: true })
  @JoinColumn({ name: 'memberPackageId' })
  memberPackage: MemberPackage;

  @Column({ nullable: true })
  staffId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({
    type: 'simple-enum',
    enum: DeductionType,
  })
  deductionType: DeductionType;

  @Column('int', { default: 0 })
  packageCountUsed: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balanceUsed: number;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}
