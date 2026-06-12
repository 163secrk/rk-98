import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Staff, StaffStatus, UserRole } from '../entities/staff.entity';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async create(createStaffDto: CreateStaffDto): Promise<Staff> {
    const existing = await this.staffRepository.findOne({
      where: { username: createStaffDto.username },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }
    const hashedPassword = await bcrypt.hash(createStaffDto.password, 10);
    const staff = this.staffRepository.create({
      ...createStaffDto,
      password: hashedPassword,
    });
    const saved = await this.staffRepository.save(staff);
    delete saved.password;
    return saved;
  }

  async findAll(): Promise<Staff[]> {
    const staff = await this.staffRepository.find({
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
    return staff.map((s) => {
      delete s.password;
      return s;
    });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!staff) {
      throw new NotFoundException('员工不存在');
    }
    delete staff.password;
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('员工不存在');
    }
    if (updateStaffDto.password) {
      updateStaffDto.password = await bcrypt.hash(updateStaffDto.password, 10);
    }
    Object.assign(staff, updateStaffDto);
    const saved = await this.staffRepository.save(staff);
    delete saved.password;
    return saved;
  }

  async remove(id: string): Promise<void> {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('员工不存在');
    }
    staff.status = StaffStatus.INACTIVE;
    await this.staffRepository.save(staff);
  }

  async initAdmin() {
    const existing = await this.staffRepository.findOne({
      where: { username: 'admin' },
    });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = this.staffRepository.create({
        username: 'admin',
        password: hashedPassword,
        realName: '系统管理员',
        role: UserRole.ADMIN,
        status: StaffStatus.ACTIVE,
      });
      await this.staffRepository.save(admin);
      console.log('Admin user created: admin / admin123');
    }
  }
}
