import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Customer } from './customer.entity';
import { RechargeRecord } from './recharge-record.entity';
import { MemberPackage } from './member-package.entity';

export enum MemberLevel {
  NORMAL = 'normal',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  memberNo: string;

  @Column()
  customerId: string;

  @OneToOne(() => Customer, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalRecharged: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalBonus: number;

  @Column({
    type: 'simple-enum',
    enum: MemberLevel,
    default: MemberLevel.NORMAL,
  })
  level: MemberLevel;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => RechargeRecord, (record) => record.member)
  rechargeRecords: RechargeRecord[];

  @OneToMany(() => MemberPackage, (mp) => mp.member)
  memberPackages: MemberPackage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
