import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Store } from './store.entity';
import { Staff } from './staff.entity';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';
import { Member } from './member.entity';

export enum OrderStatus {
  RECEIVED = 'received',
  WASHING = 'washing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  staffId: string;

  @ManyToOne(() => Staff, (staff) => staff.orders)
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({ nullable: true })
  customerId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  memberId: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ nullable: true })
  customerAddress: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  remark: string;

  @Column({ type: 'datetime', nullable: true })
  pickupDate: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
