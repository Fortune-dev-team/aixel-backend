import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SaveAnswersDto } from './dto/save-answers.dto';
import { PretestService } from './pretest.service';

@Controller('pretest')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PretestController {
  constructor(private readonly service: PretestService) {}

  @Post('sessions')
  start(@CurrentUser() user: AuthenticatedUser) {
    return this.service.startOrResume(user.id);
  }

  @Get('sessions')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMySessions(user.id);
  }

  @Get('sessions/:id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getMySession(user.id, id);
  }

  @Put('sessions/:id/answers')
  saveAnswers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveAnswersDto,
  ) {
    return this.service.saveAnswers(user.id, id, dto);
  }

  @Post('sessions/:id/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.submit(user.id, id);
  }

  @Get('results/latest')
  latestResult(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getLatestResult(user.id);
  }
}
