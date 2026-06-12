import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Staff } from '../entities/staff.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const staff = await this.staffRepository.findOne({
      where: { username },
      relations: ['store'],
    });

    if (!staff) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (staff.status !== 'active') {
      throw new UnauthorizedException('账号已被禁用');
    }

    const payload = { sub: staff.id, username: staff.username, role: staff.role };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: staff.id,
        username: staff.username,
        realName: staff.realName,
        role: staff.role,
        phone: staff.phone,
        storeId: staff.storeId,
        storeName: staff.store?.name,
      },
    };
  }
}
