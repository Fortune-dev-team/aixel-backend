import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminAttributeCategoriesService } from './admin-attribute-categories.service';
import { CreateAttributeCategoryDto } from './dto/create-attribute-category.dto';
import { UpdateAttributeCategoryDto } from './dto/update-attribute-category.dto';

@Controller('admin/attribute-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAttributeCategoriesController {
  constructor(private readonly service: AdminAttributeCategoriesService) {}

  @Post()
  create(@Body() dto: CreateAttributeCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
