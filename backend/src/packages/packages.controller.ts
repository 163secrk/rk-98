import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/staff.entity';

@Controller('packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createDto: CreatePackageDto) {
    return this.packagesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.packagesService.findAll();
  }

  @Get('active/list')
  findActive() {
    return this.packagesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateDto: UpdatePackageDto) {
    return this.packagesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
