import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';

import { QuestionBankService } from './question-bank.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionPaginationDto } from './dto/question-pagination.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { GenerateQuestionDto } from './dto/generate-question.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('admin/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Post()
  create(
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionBankService.create(dto, user);
  }

  @Post('generate')
  generate(
    @Body() dto: GenerateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionBankService.generate(dto, user);
  }

  @Get()
  findAll(@Query() query: QuestionPaginationDto) {
    return this.questionBankService.findAll(query.page, query.limit);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionBankService.update(id, dto);
  }

  @Delete(':id')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionBankService.archive(id);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionBankService.approve(id);
  }

  @Post(':id/retire')
  retire(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionBankService.retire(id);
  }
}
