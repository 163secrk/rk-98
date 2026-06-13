import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Staff } from './staff.entity';

export enum RechargeType {
  CASH = 'cash',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  BANK_CARD = 'bank_card',
}

@Entity('recharge_records')
export class RechargeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => Member, (member) => member.rechargeRecords)
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ nullable: true })
  staffId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  bonusAmount: number;

  @Column({
    type: 'simple-enum',
    enum: RechargeType,
    default: RechargeType.CASH,
  })
  payType: RechargeType;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}
