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
import { ClothingType } from './clothing-type.entity';
import { MemberPackage } from './member-package.entity';

export enum PackageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  clothingTypeId: string;

  @ManyToOne(() => ClothingType)
  @JoinColumn({ name: 'clothingTypeId' })
  clothingType: ClothingType;

  @Column('int')
  totalCount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: PackageStatus,
    default: PackageStatus.ACTIVE,
  })
  status: PackageStatus;

  @Column({ nullable: true })
  validDays: number;

  @OneToMany(() => MemberPackage, (mp) => mp.package)
  memberPackages: MemberPackage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
