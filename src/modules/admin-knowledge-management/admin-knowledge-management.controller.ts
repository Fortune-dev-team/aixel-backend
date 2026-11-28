import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { AdminKnowledgeManagementService } from './admin-knowledge-management.service';
import { CreateKnowledgeSourceDto } from './dto/create-knowledge-source.dto';
import { ListKnowledgeSourceQueryDto } from './dto/list-knowledge-source-query.dto';
import { UpdateKnowledgeSourceDto } from './dto/update-knowledge-source.dto';
import { UpdateKnowledgeSourceStatusDto } from './dto/update-knowledge-source-status.dto';

@ApiTags('Admin Knowledge Management')
@ApiBearerAuth()
@Controller('admin/knowledge-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminKnowledgeManagementController {
  constructor(private readonly service: AdminKnowledgeManagementService) {}

  @Get()
  @ApiOperation({
    summary: 'List knowledge sources',
  })
  list(@Query() query: ListKnowledgeSourceQueryDto) {
    return this.service.list(query);
  }

  @Get('coverage')
  @ApiOperation({
    summary: 'Get knowledge coverage monitoring',
  })
  getCoverage() {
    return this.service.getCoverage();
  }

  @Get('dead-links')
  getDeadLinks() {
    return this.service.getDeadLinks();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get knowledge source detail',
  })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create knowledge source',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateKnowledgeSourceDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update knowledge source metadata',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKnowledgeSourceDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update knowledge source ingestion/status',
  })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKnowledgeSourceStatusDto,
  ) {
    return this.service.updateStatus(user.id, id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate knowledge source',
  })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.activate(user.id, id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate knowledge source',
  })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.deactivate(user.id, id);
  }

  @Post(':id/check-link')
  @ApiOperation({
    summary: 'Check knowledge source URL',
  })
  checkLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.checkLink(user.id, id);
  }

  @Post(':id/reprocess')
  reprocess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.reprocess(user.id, id);
  }

  @Post(':id/verify')
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.verify(user.id, id);
  }

  @Get(':id/chunks')
  getChunks(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getChunks(id);
  }

  @Post('check-links')
  checkLinks(@CurrentUser() user: AuthenticatedUser) {
    return this.service.checkLinks(user.id);
  }


  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete knowledge source',
  })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user.id, id);
  }
}
