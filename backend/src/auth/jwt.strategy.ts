import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'laundry-secret-key-2024',
    });
  }

  async validate(payload: any) {
    const staff = await this.staffRepository.findOne({
      where: { id: payload.sub },
      relations: ['store'],
    });
    if (!staff) {
      throw new UnauthorizedException('用户不存在');
    }
    return staff;
  }
}
