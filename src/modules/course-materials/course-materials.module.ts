import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourseMaterialsController } from './course-materials.controller';
import { CourseMaterialsService } from './course-materials.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Goal } from './entities/goal.entity';
import { AttributeLevel } from './entities/attribute-level.entity';
import { CourseMaterial } from './entities/course-material.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Goal,
      AttributeLevel,
      CourseMaterial
    ])
  ],
  controllers: [CourseMaterialsController],
  providers: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
