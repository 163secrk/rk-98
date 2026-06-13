import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package, PackageStatus } from '../entities/package.entity';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
  ) {}

  async create(createDto: CreatePackageDto): Promise<Package> {
    const existing = await this.packageRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException('套餐名称已存在');
    }
    const pkg = this.packageRepository.create(createDto);
    return this.packageRepository.save(pkg);
  }

  async findAll(): Promise<Package[]> {
    return this.packageRepository.find({
      relations: ['clothingType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Package[]> {
    return this.packageRepository.find({
      where: { status: PackageStatus.ACTIVE },
      relations: ['clothingType'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Package> {
    const pkg = await this.packageRepository.findOne({
      where: { id },
      relations: ['clothingType'],
    });
    if (!pkg) {
      throw new NotFoundException('套餐不存在');
    }
    return pkg;
  }

  async update(id: string, updateDto: UpdatePackageDto): Promise<Package> {
    const pkg = await this.findOne(id);
    if (updateDto.name && updateDto.name !== pkg.name) {
      const existing = await this.packageRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new ConflictException('套餐名称已存在');
      }
    }
    Object.assign(pkg, updateDto);
    return this.packageRepository.save(pkg);
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);
    pkg.status = PackageStatus.INACTIVE;
    await this.packageRepository.save(pkg);
  }

  async initDefaultData() {
    const count = await this.packageRepository.count();
    if (count === 0) {
      const clothingTypeRepository = this.packageRepository.manager.getRepository('clothing_types');
      const downJacket = await clothingTypeRepository.findOne({ where: { name: '羽绒服' } });
      
      if (downJacket) {
        const defaults = [
          {
            name: '羽绒服3件套餐',
            clothingTypeId: downJacket.id,
            totalCount: 3,
            price: 99,
            description: '99元洗3件羽绒服，超值优惠',
            validDays: 365,
          },
          {
            name: '羽绒服5件套餐',
            clothingTypeId: downJacket.id,
            totalCount: 5,
            price: 159,
            description: '159元洗5件羽绒服，更划算',
            validDays: 365,
          },
        ];
        for (const item of defaults) {
          const entity = this.packageRepository.create(item);
          await this.packageRepository.save(entity);
        }
        console.log('Default packages created');
      }
    }
  }
}
