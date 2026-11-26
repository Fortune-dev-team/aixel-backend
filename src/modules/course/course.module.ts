import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { MaterialProgress } from './entities/material-progress.entity';
import { Goal } from '../course-materials/entities/goal.entity';
import { CourseMaterial } from '../course-materials/entities/course-material.entity';
import { AttributeLevel } from '../course-materials/entities/attribute-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    MaterialProgress,
    Goal,
    CourseMaterial,
    AttributeLevel 
    ])
  ],
  controllers: [CourseController],
  providers: [CourseService]
})
export class CourseModule {}
