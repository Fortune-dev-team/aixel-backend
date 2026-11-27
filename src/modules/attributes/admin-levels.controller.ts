import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminLevelsService } from './admin-levels.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { ReplaceIndicatorsDto } from './dto/replace-indicators.dto';
import { UpdateLevelDto } from './dto/update-level.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLevelsController {
  constructor(private readonly service: AdminLevelsService) {}

  @Post('attributes/:id/levels')
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLevelDto,
  ) {
    return this.service.create(id, dto);
  }

  @Patch('levels/:levelId')
  update(
    @Param('levelId', ParseUUIDPipe) levelId: string,
    @Body() dto: UpdateLevelDto,
  ) {
    return this.service.update(levelId, dto);
  }

  @Delete('levels/:levelId')
  remove(@Param('levelId', ParseUUIDPipe) levelId: string) {
    return this.service.remove(levelId);
  }

  @Put('levels/:levelId/indicators')
  replaceIndicators(
    @Param('levelId', ParseUUIDPipe) levelId: string,
    @Body() dto: ReplaceIndicatorsDto,
  ) {
    return this.service.replaceIndicators(levelId, dto);
  }
}
