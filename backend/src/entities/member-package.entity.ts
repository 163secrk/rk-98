import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Package } from './package.entity';
import { Staff } from './staff.entity';

export enum MemberPackageStatus {
  ACTIVE = 'active',
  USED_UP = 'used_up',
  EXPIRED = 'expired',
}

@Entity('member_packages')
export class MemberPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => Member, (member) => member.memberPackages)
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column()
  packageId: string;

  @ManyToOne(() => Package, (pkg) => pkg.memberPackages)
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @Column({ nullable: true })
  staffId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column('int')
  totalCount: number;

  @Column('int', { default: 0 })
  usedCount: number;

  @Column('int', { default: 0 })
  remainingCount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  purchasePrice: number;

  @Column({
    type: 'simple-enum',
    enum: MemberPackageStatus,
    default: MemberPackageStatus.ACTIVE,
  })
  status: MemberPackageStatus;

  @Column({ type: 'datetime', nullable: true })
  expireDate: Date;

  @CreateDateColumn()
  purchaseDate: Date;
}
