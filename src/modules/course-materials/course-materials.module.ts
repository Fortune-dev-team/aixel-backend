import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourseMaterialsController } from './course-materials.controller';
import { CourseMaterialsService } from './course-materials.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Goal } from './entities/goal.entity';
import { AttributeLevel } from './entities/attribute-level.entity';
import { CourseMaterial } from './entities/course-material.entity';
import { CourseMaterialsAdminController } from './course-materials-admin.controller';
import { MaterialProgress } from './entities/material-progress.entity';
import { CourseMaterialSource } from './entities/course-material-source.entity';


@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Goal,
      AttributeLevel,
      CourseMaterial,
      MaterialProgress,
      CourseMaterialSource
    ])
  ],
  controllers: [CourseMaterialsController, CourseMaterialsAdminController],
  providers: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
