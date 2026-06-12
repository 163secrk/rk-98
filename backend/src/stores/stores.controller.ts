import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/staff.entity';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
