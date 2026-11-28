import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { KnowledgeBaseService } from './knowledge-base.service';

export const KNOWLEDGE_INGESTION_QUEUE = 'knowledge-ingestion';

@Processor(KNOWLEDGE_INGESTION_QUEUE)
export class KnowledgeIngestionProcessor extends WorkerHost {
    constructor(private readonly knowledgeBase: KnowledgeBaseService) {
        super();
    }

    async process(job: Job<{ sourceId: string }>): Promise<void> {
        if (job.name !== 'ingest-document') {
        throw new Error(`Unsupported job name: ${job.name}`);
        }

        await this.knowledgeBase.processIngestion(job.data.sourceId);
    }
}