import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'

import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';
import { MentorRequest } from './entities/mentor-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MentorRequest])],
  controllers: [MentorController],
  providers: [MentorService]
})
export class MentorModule {}
