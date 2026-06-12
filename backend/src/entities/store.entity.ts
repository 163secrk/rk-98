import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Staff } from './staff.entity';
import { Order } from './order.entity';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  manager: string;

  @Column({
    type: 'simple-enum',
    enum: StoreStatus,
    default: StoreStatus.ACTIVE,
  })
  status: StoreStatus;

  @OneToMany(() => Staff, (staff) => staff.store)
  staff: Staff[];

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
