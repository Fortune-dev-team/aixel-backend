import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AttributesService } from './attributes.service';

@Controller('attribute-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttributeCategoriesController {
  constructor(private readonly service: AttributesService) {}

  @Get()
  list() {
    return this.service.listCategories();
  }
}
