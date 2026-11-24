import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Goal } from './entities/goal.entity';
import { AttributeLevel } from './entities/attribute-level.entity';
import { CourseMaterial } from './entities/course-material.entity';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class CourseMaterialsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,

    @InjectRepository(AttributeLevel)
    private readonly attributeLevelRepository: Repository<AttributeLevel>,

    @InjectRepository(CourseMaterial)
    private readonly courseMaterialRepository: Repository<CourseMaterial>,
  ) {}

  async findAll(goalId: string, levelId: string, user: AuthenticatedUser) {
    const goal = await this.goalRepository.findOne({
      where: {
        id: goalId,
        userId: user.id,
      },
    });

    if (!goal) {
      throw new NotFoundException(
        `Goal with ID ${goalId} not found for the current user.`,
      );
    }

    if (!goal.attributeId) {
      throw new NotFoundException(
        `Goal with ID ${goalId} does not have an associated attribute.`,
      );
    }

    const level = await this.attributeLevelRepository.findOne({
      where: {
        id: levelId,
        attributeId: goal.attributeId,
      },
    });

    if (!level) {
      throw new NotFoundException(
        `Level with ID ${levelId} not found for the attribute associated with the goal.`,
      );
    }

    const materials = await this.courseMaterialRepository.find({
      where: {
        levelId: levelId,
        status: 'APPROVED',
      },
    });

    return materials;
  }

  async findOne(
    goalId: string,
    levelId: string,
    materialId: string,
    user: AuthenticatedUser,
  ) {
    const goal = await this.goalRepository.findOne({
        where: {
            id: goalId,
            userId: user.id
        }
    });

    if (!goal) {
        throw new NotFoundException(
            `Goal with ID ${goalId} not found for the current user.`
        );
    }

    if (!goal.attributeId) {
        throw new NotFoundException(
            `Goal with ID ${goalId} does not have an associated attribute.`
        );
    }

    const level = await this.attributeLevelRepository.findOne({
        where: {
            id: levelId,
            attributeId: goal.attributeId
        }
    });

    if (!level) {
        throw new NotFoundException(
            `Level with ID ${levelId} not found for the attribute associated with the goal.`
        );
    }

    const material = await this.courseMaterialRepository.findOne({
        where: {
            id: materialId,
            levelId: levelId,
            status: 'APPROVED'
        }
    });

    if (!material) {
        throw new NotFoundException(
            `Material with ID ${materialId} not found for the level associated with the goal.`
        )
    }

    return material;
    
  }
}
