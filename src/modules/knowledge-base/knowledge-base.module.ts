import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import {
  KNOWLEDGE_INGESTION_QUEUE,
  KnowledgeIngestionProcessor,
} from './knowledge-ingestion.processor';
import { AiProviderService } from '../../ai/providers/ai-provider.service';
import { ObjectStorageService } from '../../storage/object-storage.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: KNOWLEDGE_INGESTION_QUEUE }),
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    KnowledgeIngestionProcessor,
    AiProviderService,
    ObjectStorageService,
  ],
})
export class KnowledgeBaseModule {}