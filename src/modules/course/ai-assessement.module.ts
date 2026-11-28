import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from '../auth/auth.module';
import { AiProviderService } from '../../ai/providers/ai-provider.service';
import { AI_ASSESSMENT_QUEUE, AiAssessmentService } from './ai-assessement.service';
import { AiAssessmentProcessor } from './ai-assessement.processor';
import { AiAssessmentController } from './ai-assessement.controller';
import { AiMonitoringService } from '../ai-monitoring/ai-monitoring.service';

@Module({
    imports: [
        AuthModule,
        BullModule.registerQueue({ name: AI_ASSESSMENT_QUEUE }),
    ],
    controllers: [AiAssessmentController],
    providers: [
        AiAssessmentService,
        AiAssessmentProcessor,
        AiMonitoringService,
        AiProviderService,
    ],
    exports: [AiAssessmentService],
})
export class AiAssessmentModule {}