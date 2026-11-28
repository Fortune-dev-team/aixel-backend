import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { KnowledgeBaseService } from './knowledge-base.service';
import { SearchKnowledgeDto } from './dto/search-knowledge.dto';
import { KNOWLEDGE_INGESTION_QUEUE } from './knowledge-ingestion.processor';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnowledgeBaseController {
    constructor(
        private readonly knowledgeBase: KnowledgeBaseService,
        @InjectQueue(KNOWLEDGE_INGESTION_QUEUE)
        private readonly ingestionQueue: Queue,
    ) {}

    @Post('admin/knowledge-sources/upload')
    @Roles(UserRole.ADMIN)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async upload(
        @UploadedFile() file: Express.Multer.File | undefined,
        @Body('title') title: string,
        @Body('attributeId') attributeId: string | undefined,
        @Body('levelId') levelId: string | undefined,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        if (!file) throw new BadRequestException('Field "file" is required');
        if (!title?.trim()) throw new BadRequestException('Field "title" is required');

        return this.knowledgeBase.uploadDocument({
        file,
        title: title.trim(),
        attributeId,
        levelId,
        userId: user.id,
        queueIngestion: async (sourceId) => {
            await this.ingestionQueue.add(
            'ingest-document',
            { sourceId },
            {
                jobId: `ingest-${sourceId}`,
                attempts: 3,
                backoff: { type: 'exponential', delay: 2_000 },
                removeOnComplete: 500,
                removeOnFail: 1_000,
            },
            );
        },
        });
    }

    @Post('admin/knowledge/search')
    @Roles(UserRole.ADMIN)
    search(@Body() dto: SearchKnowledgeDto, @CurrentUser() user: AuthenticatedUser) {
        return this.knowledgeBase.searchAndAnswer(dto, user.id);
    }

    @Get('admin/knowledge-sources/:id')
    @Roles(UserRole.ADMIN)
    sourceStatus(@Param('id', ParseUUIDPipe) id: string) {
        return this.knowledgeBase.getSourceStatus(id);
    }

    @Get('admin/ai-runs/:id')
    @Roles(UserRole.ADMIN)
    aiRun(@Param('id', ParseUUIDPipe) id: string) {
        return this.knowledgeBase.getAiRun(id);
    }
}