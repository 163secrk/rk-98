import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ClothingTypesService } from './clothing-types.service';
import { CreateClothingTypeDto, UpdateClothingTypeDto } from './dto/clothing-type.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/staff.entity';

@Controller('clothing-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClothingTypesController {
  constructor(private readonly clothingTypesService: ClothingTypesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createDto: CreateClothingTypeDto) {
    return this.clothingTypesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.clothingTypesService.findAll();
  }

  @Get('active/list')
  findActive() {
    return this.clothingTypesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clothingTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateDto: UpdateClothingTypeDto) {
    return this.clothingTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.clothingTypesService.remove(id);
  }
}
