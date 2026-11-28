import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';

import { Question } from './entities/question.entity'
import { QuestionOption } from './entities/question-option.entity';
import { QuestionChunk } from './entities/question-chunk.entity';
import { Rubric } from './entities/rubric.entity';
import { AiGenerationRun } from './entities/ai-generation-run.entity';
import { AiGenerationRunChunk } from './entities/ai-generation-run-chunk.entity';
import { AttributeLevel } from '../course-materials/entities/attribute-level.entity';

import { AiProviderService } from '../../ai/providers/ai-provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionOption,
      QuestionChunk,
      Rubric,
      AiGenerationRun,
      AiGenerationRunChunk,
      AttributeLevel
    ]),
  ],
  controllers: [QuestionBankController],
  providers: [QuestionBankService, AiProviderService],
  exports: [QuestionBankService]
})
export class QuestionBankModule {}
