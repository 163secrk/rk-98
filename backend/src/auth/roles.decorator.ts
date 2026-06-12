import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/staff.entity';
import { ROLES_KEY } from './auth.guard';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
