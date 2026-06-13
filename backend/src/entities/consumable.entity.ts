import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConsumableRecord } from './consumable-record.entity';
import { Store } from './store.entity';

export enum ConsumableType {
  RECYCLABLE = 'recyclable',
  NON_RECYCLABLE = 'non_recyclable',
}

export enum ConsumableStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('consumables')
export class Consumable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: ConsumableType,
  })
  type: ConsumableType;

  @Column()
  unit: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  threshold: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ nullable: true })
  specification: string;

  @Column({
    type: 'simple-enum',
    enum: ConsumableStatus,
    default: ConsumableStatus.ACTIVE,
  })
  status: ConsumableStatus;

  @Column({ nullable: true })
  remark: string;

  @OneToMany(() => ConsumableRecord, (record) => record.consumable)
  records: ConsumableRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
