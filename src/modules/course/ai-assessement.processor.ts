import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import {
    AI_ASSESSMENT_QUEUE,
    AiAssessmentService,
} from './ai-assessement.service';

@Processor(AI_ASSESSMENT_QUEUE)
export class AiAssessmentProcessor extends WorkerHost {
    constructor(private readonly assessment: AiAssessmentService) {
        super();
    }

    async process(
        job: Job<{
        attemptId?: string;
        answerId?: string;
        runs?: number;
        adminId?: string;
        }>,
    ): Promise<unknown> {
        if (job.name === 'grade-attempt' && job.data.attemptId) {
        return this.assessment.processAttemptGrading(job.data.attemptId);
        }

        if (
        job.name === 'consistency-check' &&
        job.data.answerId &&
        job.data.adminId
        ) {
        return this.assessment.processConsistencyCheck({
            answerId: job.data.answerId,
            runs: job.data.runs ?? 3,
            adminId: job.data.adminId,
        });
        }

        throw new Error(`Unsupported AI assessment job: ${job.name}`);
    }
}