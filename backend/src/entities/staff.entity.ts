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
import { Order } from './order.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  realName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({
    type: 'simple-enum',
    enum: StaffStatus,
    default: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @Column({ nullable: true })
  storeId: string;

  @ManyToOne(() => Store, (store) => store.staff, { nullable: true })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => Order, (order) => order.staff)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
