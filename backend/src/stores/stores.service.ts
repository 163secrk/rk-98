import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../entities/store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const existing = await this.storeRepository.findOne({
      where: { name: createStoreDto.name },
    });
    if (existing) {
      throw new ConflictException('门店名称已存在');
    }
    const store = this.storeRepository.create(createStoreDto);
    return this.storeRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('门店不存在');
    }
    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);
    if (updateStoreDto.name && updateStoreDto.name !== store.name) {
      const existing = await this.storeRepository.findOne({
        where: { name: updateStoreDto.name },
      });
      if (existing) {
        throw new ConflictException('门店名称已存在');
      }
    }
    Object.assign(store, updateStoreDto);
    return this.storeRepository.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    store.status = StoreStatus.INACTIVE;
    await this.storeRepository.save(store);
  }
}
