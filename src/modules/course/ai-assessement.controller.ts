import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import {
    CreateConsistencyCheckDto,
    ResolveUncertainCaseDto,
} from './ai-assessement.dto';
import { AiAssessmentService } from './ai-assessement.service';
import { AiMonitoringService } from '../ai-monitoring/ai-monitoring.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiAssessmentController {
    constructor(
        private readonly assessment: AiAssessmentService,
        private readonly monitoring: AiMonitoringService,
    ) {}

    @Post('attempts/:attemptId/grade')
    @Roles(UserRole.TEAM)
    enqueueGrading(
        @Param('attemptId', ParseUUIDPipe) attemptId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.assessment.enqueueAttemptGrading(attemptId, user);
    }

    @Get('attempts/:attemptId/ai-results')
    @Roles(UserRole.TEAM)
    getAttemptResults(
        @Param('attemptId', ParseUUIDPipe) attemptId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.assessment.getAttemptResults(attemptId, user);
    }

    @Get('admin/ai-monitoring/score-distribution')
    @Roles(UserRole.ADMIN)
    scoreDistribution() {
        return this.monitoring.scoreDistribution();
    }

    @Get('admin/ai-monitoring/uncertain-cases')
    @Roles(UserRole.ADMIN)
    uncertainCases() {
        return this.monitoring.uncertainCases();
    }

    @Post('admin/ai-monitoring/uncertain-cases/:answerId/resolve')
    @Roles(UserRole.ADMIN)
    resolveUncertainCase(
        @Param('answerId', ParseUUIDPipe) answerId: string,
        @Body() dto: ResolveUncertainCaseDto,
        @CurrentUser() admin: AuthenticatedUser,
    ) {
        return this.assessment.resolveUncertainCase(answerId, dto, admin);
    }

    @Post('admin/ai-monitoring/consistency-checks')
    @Roles(UserRole.ADMIN)
    createConsistencyCheck(
        @Body() dto: CreateConsistencyCheckDto,
        @CurrentUser() admin: AuthenticatedUser,
    ) {
        return this.assessment.enqueueConsistencyCheck(dto, admin);
    }

    @Get('admin/ai-monitoring/consistency-checks')
    @Roles(UserRole.ADMIN)
    consistencyChecks() {
        return this.monitoring.consistencyChecks();
    }

    @Get('admin/ai-monitoring/generation-runs')
    @Roles(UserRole.ADMIN)
    generationRuns() {
        return this.monitoring.generationRuns();
    }

    @Get('admin/ai-monitoring/generation-runs/:id')
    @Roles(UserRole.ADMIN)
    generationRun(@Param('id', ParseUUIDPipe) id: string) {
        return this.monitoring.generationRun(id);
    }

    @Get('admin/ai-monitoring/grading-runs')
    @Roles(UserRole.ADMIN)
    gradingRuns() {
        return this.monitoring.gradingRuns();
    }

    @Get('admin/ai-monitoring/grading-runs/:id')
    @Roles(UserRole.ADMIN)
    gradingRun(@Param('id', ParseUUIDPipe) id: string) {
        return this.monitoring.gradingRun(id);
    }
}