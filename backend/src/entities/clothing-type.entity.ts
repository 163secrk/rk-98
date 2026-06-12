import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum ClothingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('clothing_types')
export class ClothingType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: ClothingStatus,
    default: ClothingStatus.ACTIVE,
  })
  status: ClothingStatus;

  @OneToMany(() => OrderItem, (item) => item.clothingType)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
