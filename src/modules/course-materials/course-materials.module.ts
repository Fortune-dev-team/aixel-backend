import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourseMaterialsController } from './course-materials.controller';
import { CourseMaterialsService } from './course-materials.service';

@Module({
  imports: [AuthModule],
  controllers: [CourseMaterialsController],
  providers: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
