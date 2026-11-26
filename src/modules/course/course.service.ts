import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { MaterialProgress } from './entities/material-progress.entity';
import { Goal } from '../course-materials/entities/goal.entity';
import { CourseMaterial } from '../course-materials/entities/course-material.entity';
import { AttributeLevel } from '../course-materials/entities/attribute-level.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(MaterialProgress)
    private readonly materialProgressRepository: Repository<MaterialProgress>,

    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,

    @InjectRepository(CourseMaterial)
    private readonly courseMaterialRepository: Repository<CourseMaterial>,

    @InjectRepository(AttributeLevel)
    private readonly attributeLevelRepository: Repository<AttributeLevel>,
  ) {}

  async completeMaterial(materialId: string, user: AuthenticatedUser) {
    const material = await this.courseMaterialRepository.findOne({
      where: {
        id: materialId,
      },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${materialId} not found`);
    }

    if (material.status !== 'APPROVED') {
      throw new NotFoundException('Material is not available');
    }

    const level = await this.attributeLevelRepository.findOne({
      where: {
        id: material.levelId ?? undefined,
      },
    });

    if (!level?.attributeId) {
      throw new NotFoundException(
        `Attribute level with ID ${material.levelId} not found`,
      );
    }

    const goals = await this.goalRepository.find({
      where: {
        userId: user.id,
        attributeId: level.attributeId,
      },
    });

    if (goals.length === 0) {
      throw new NotFoundException(
        `No goals found for user with ID ${user.id} and attribute ID ${level.attributeId}`,
      );
    }

    if (goals.length > 1) {
      throw new ConflictException(
        `Multiple goals found for user with ID ${user.id} and attribute ID ${level.attributeId}`,
      );
    }

    const goal = goals[0];

    let progress = await this.materialProgressRepository.findOne({
      where: {
        userId: user.id,
        goalId: goal.id,
        materialId: material.id,
      }
    });

    if (!progress) {
        progress = this.materialProgressRepository.create({
            id: randomUUID(),
            userId: user.id,
            goalId: goal.id,
            materialId: material.id,
            completedAt: new Date(),
        });
    } else {
        progress.completedAt = new Date();
    }

    await this.materialProgressRepository.save(progress);

    return {
      material,
      level,
      progress,
    };
  }
}
