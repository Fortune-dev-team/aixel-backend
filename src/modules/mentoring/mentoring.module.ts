import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  AttributeLevel,
  ConflictOfInterest,
  Goal,
  GoalLevelProgress,
  Interview,
  InterviewSlot,
  MemberAttribute,
  MentorRequest,
} from './entities/mentoring.entities';
import { MentoringController } from './mentoring.controller';
import { MentoringService } from './mentoring.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Goal,
      AttributeLevel,
      GoalLevelProgress,
      MemberAttribute,
      ConflictOfInterest,
      MentorRequest,
      Interview,
      InterviewSlot,
    ]),
  ],
  controllers: [MentoringController],
  providers: [MentoringService],
  exports: [MentoringService],
})
export class MentoringModule {}