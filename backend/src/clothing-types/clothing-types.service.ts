import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClothingType, ClothingStatus } from '../entities/clothing-type.entity';
import { CreateClothingTypeDto, UpdateClothingTypeDto } from './dto/clothing-type.dto';

@Injectable()
export class ClothingTypesService {
  constructor(
    @InjectRepository(ClothingType)
    private readonly clothingTypeRepository: Repository<ClothingType>,
  ) {}

  async create(createDto: CreateClothingTypeDto): Promise<ClothingType> {
    const existing = await this.clothingTypeRepository.findOne({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException('衣物类型名称已存在');
    }
    const item = this.clothingTypeRepository.create(createDto);
    return this.clothingTypeRepository.save(item);
  }

  async findAll(): Promise<ClothingType[]> {
    return this.clothingTypeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<ClothingType[]> {
    return this.clothingTypeRepository.find({
      where: { status: ClothingStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ClothingType> {
    const item = await this.clothingTypeRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('衣物类型不存在');
    }
    return item;
  }

  async update(id: string, updateDto: UpdateClothingTypeDto): Promise<ClothingType> {
    const item = await this.findOne(id);
    if (updateDto.name && updateDto.name !== item.name) {
      const existing = await this.clothingTypeRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new ConflictException('衣物类型名称已存在');
      }
    }
    Object.assign(item, updateDto);
    return this.clothingTypeRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    item.status = ClothingStatus.INACTIVE;
    await this.clothingTypeRepository.save(item);
  }

  async initDefaultData() {
    const count = await this.clothingTypeRepository.count();
    if (count === 0) {
      const defaults = [
        { name: '衬衫', price: 15, description: '棉/化纤衬衫' },
        { name: 'T恤', price: 10, description: '短袖/长袖T恤' },
        { name: '西裤', price: 18, description: '正装西裤' },
        { name: '牛仔裤', price: 15, description: '牛仔衣物' },
        { name: '外套', price: 30, description: '普通外套' },
        { name: '大衣', price: 50, description: '毛呢大衣' },
        { name: '羽绒服', price: 60, description: '羽绒服清洗' },
        { name: '西装', price: 45, description: '西装套装' },
        { name: '裙子', price: 20, description: '连衣裙/半身裙' },
        { name: '床上四件套', price: 40, description: '床上用品' },
      ];
      for (const item of defaults) {
        const entity = this.clothingTypeRepository.create(item);
        await this.clothingTypeRepository.save(entity);
      }
      console.log('Default clothing types created');
    }
  }
}
