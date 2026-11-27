import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, In, IsNull, MoreThan } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
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
import type { CreateMentorRequestDto } from './dto/create-mentor-request.dto';
import type { RejectMentorRequestDto } from './dto/respond-mentor-request.dto';

const ACTIVE_REQUEST_STATUSES = ['PENDING', 'ACCEPTED'];
const TERMINAL_REQUEST_STATUSES = ['REJECTED', 'CANCELLED', 'EXPIRED'];

interface SlotInput {
  startAt: string;
  endAt: string;
}

@Injectable()
export class MentoringService {
  constructor(private readonly dataSource: DataSource) {}

  async createRequest(
    user: AuthenticatedUser,
    goalId: string,
    dto: CreateMentorRequestDto,
    idempotencyKey?: string,
  ) {
    if (!idempotencyKey?.trim() || idempotencyKey.length > 100) {
      throw new BadRequestException(
        'Header Idempotency-Key wajib diisi dan maksimal 100 karakter',
      );
    }

    const slots = this.validateSlots(dto.slots);

    return this.dataSource.transaction(async (manager) => {
      const existingByKey = await manager.getRepository(MentorRequest).findOne({
        where: {
          menteeId: user.id,
          idempotencyKey,
        },
      });

      if (existingByKey) {
        return this.getRequestForUser(manager, existingByKey.id, user.id);
      }

      const goal = await manager.getRepository(Goal).findOne({
        where: { id: goalId },
      });

      if (!goal || goal.userId !== user.id) {
        throw new NotFoundException('Goal tidak ditemukan');
      }
      if (!goal.attributeId) {
        throw new BadRequestException('Goal belum memiliki atribut');
      }

      const levelTwoProgress = await this.findPassedLevelTwo(manager, goalId);
      if (!levelTwoProgress) {
        throw new ConflictException(
          'Permintaan mentor hanya dapat diajukan setelah Level 2 lulus',
        );
      }

      if (
        levelTwoProgress.cooldownUntil &&
        levelTwoProgress.cooldownUntil.getTime() > Date.now()
      ) {
        throw new ConflictException(
          `Cooldown masih berlaku sampai ${levelTwoProgress.cooldownUntil.toISOString()}`,
        );
      }

      const maxRounds = await this.getMaximumInterviewRounds(manager);
      const roundNumber = (levelTwoProgress.interviewRoundsUsed ?? 0) + 1;
      if (roundNumber > maxRounds) {
        throw new ConflictException(
          'Batas pengajuan wawancara ulang telah tercapai',
        );
      }

      if (dto.mentorId === user.id) {
        throw new BadRequestException('Anggota tidak dapat memilih dirinya sendiri');
      }

      const conflict = await this.hasConflict(
        manager,
        user.id,
        dto.mentorId,
      );
      if (conflict) {
        throw new ConflictException(
          'Permintaan tidak dapat dibuat karena terdapat konflik kepentingan',
        );
      }

      const duplicateActiveRequest = await manager
        .getRepository(MentorRequest)
        .findOne({
          where: {
            goalId,
            menteeId: user.id,
            status: In(ACTIVE_REQUEST_STATUSES),
          },
        });

      if (duplicateActiveRequest) {
        throw new ConflictException(
          'Goal ini sudah memiliki permintaan mentor yang masih aktif',
        );
      }

      // Mengunci baris user mentor agar request paralel tidak melampaui kapasitas.
      await manager.query(
        'SELECT id FROM users WHERE id = $1 FOR UPDATE',
        [dto.mentorId],
      );

      const capacity = await this.getMentorCapacity(manager);
      await this.assertMentorEligible(
        manager,
        dto.mentorId,
        goal.attributeId,
        user.id,
      );

      const activeCount = await manager.getRepository(MentorRequest).count({
        where: {
          mentorId: dto.mentorId,
          status: In(ACTIVE_REQUEST_STATUSES),
        },
      });

      if (activeCount >= capacity) {
        throw new ConflictException('Mentor telah mencapai kapasitas mentee');
      }

      await this.assertNoScheduledSlotConflict(
        manager,
        user.id,
        dto.mentorId,
        slots,
      );

      const requestId = randomUUID();
      const interviewId = randomUUID();
      const now = new Date();

      const request = manager.getRepository(MentorRequest).create({
        id: requestId,
        goalId,
        goalLevelProgressId: levelTwoProgress.id,
        attributeId: goal.attributeId,
        menteeId: user.id,
        mentorId: dto.mentorId,
        roundNumber,
        status: 'PENDING',
        message: dto.message?.trim() || null,
        rejectionReason: null,
        idempotencyKey,
        expiresAt: null,
        respondedAt: null,
      });
      await manager.getRepository(MentorRequest).save(request);

      const interview = manager.getRepository(Interview).create({
        id: interviewId,
        mentorRequestId: requestId,
        goalId,
        attributeId: goal.attributeId,
        menteeId: user.id,
        mentorId: dto.mentorId,
        roundNumber,
        status: 'SLOTS_PROPOSED',
        scheduledStart: null,
        scheduledEnd: null,
        location: null,
      });
      await manager.getRepository(Interview).save(interview);

      const slotEntities = slots.map((slot) =>
        manager.getRepository(InterviewSlot).create({
          id: randomUUID(),
          interviewId,
          proposedBy: user.id,
          proposerRole: 'TEAM',
          startAt: new Date(slot.startAt),
          endAt: new Date(slot.endAt),
          status: 'PENDING',
        }),
      );
      await manager.getRepository(InterviewSlot).save(slotEntities);

      return {
        ...request,
        interview: {
          ...interview,
          slots: slotEntities,
        },
      };
    });
  }

  async listMyRequests(user: AuthenticatedUser, status?: string) {
    const where: Record<string, unknown> = { menteeId: user.id };
    if (status) {
      where.status = status.toUpperCase();
    }

    return this.dataSource.getRepository(MentorRequest).find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async listMentorInbox(user: AuthenticatedUser, status?: string) {
    const where: Record<string, unknown> = { mentorId: user.id };
    if (status) {
      where.status = status.toUpperCase();
    } else {
      where.status = 'PENDING';
    }

    return this.dataSource.getRepository(MentorRequest).find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  async getRequest(user: AuthenticatedUser, requestId: string) {
    return this.dataSource.transaction(async (manager) =>
      this.getRequestForUser(manager, requestId, user.id),
    );
  }

  async cancelRequest(user: AuthenticatedUser, requestId: string) {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager
        .getRepository(MentorRequest)
        .findOne({ where: { id: requestId }, lock: { mode: 'pessimistic_write' } });

      if (!request) {
        throw new NotFoundException('Permintaan mentor tidak ditemukan');
      }
      if (request.menteeId !== user.id) {
        throw new ForbiddenException('Anda bukan pemilik permintaan ini');
      }
      if (request.status !== 'PENDING') {
        throw new ConflictException(
          'Permintaan hanya dapat dibatalkan saat masih PENDING',
        );
      }

      request.status = 'CANCELLED';
      request.respondedAt = new Date();
      await manager.getRepository(MentorRequest).save(request);

      await manager.getRepository(Interview).update(
        { mentorRequestId: request.id },
        { status: 'CANCELLED' },
      );

      await manager.getRepository(InterviewSlot).update(
        { interviewId: (await manager.getRepository(Interview).findOneByOrFail({
          mentorRequestId: request.id,
        })).id },
        { status: 'CANCELLED' },
      );

      return request;
    });
  }

  async acceptRequest(user: AuthenticatedUser, requestId: string) {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(MentorRequest).findOne({
        where: { id: requestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) {
        throw new NotFoundException('Permintaan mentor tidak ditemukan');
      }
      if (request.mentorId !== user.id) {
        throw new ForbiddenException('Permintaan ini bukan ditujukan kepada Anda');
      }
      if (request.status !== 'PENDING') {
        throw new ConflictException('Permintaan sudah pernah diproses');
      }

      const conflict = await this.hasConflict(
        manager,
        request.menteeId,
        user.id,
      );
      if (conflict) {
        throw new ConflictException(
          'Anda tidak dapat menerima permintaan karena ada konflik kepentingan',
        );
      }

      await manager.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
        user.id,
      ]);

      const capacity = await this.getMentorCapacity(manager);
      await this.assertMentorEligible(
        manager,
        user.id,
        request.attributeId,
        request.menteeId,
      );

      // Request PENDING sudah dihitung sebagai kapasitas yang dipesan.
      const activeCount = await manager.getRepository(MentorRequest).count({
        where: {
          mentorId: user.id,
          status: In(ACTIVE_REQUEST_STATUSES),
        },
      });
      if (activeCount > capacity) {
        throw new ConflictException('Kapasitas mentor telah terlampaui');
      }

      request.status = 'ACCEPTED';
      request.respondedAt = new Date();
      await manager.getRepository(MentorRequest).save(request);

      return this.getRequestForUser(manager, request.id, user.id);
    });
  }

  async rejectRequest(
    user: AuthenticatedUser,
    requestId: string,
    dto: RejectMentorRequestDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(MentorRequest).findOne({
        where: { id: requestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) {
        throw new NotFoundException('Permintaan mentor tidak ditemukan');
      }
      if (request.mentorId !== user.id) {
        throw new ForbiddenException('Permintaan ini bukan ditujukan kepada Anda');
      }
      if (request.status !== 'PENDING') {
        throw new ConflictException('Permintaan sudah pernah diproses');
      }

      request.status = 'REJECTED';
      request.rejectionReason = dto.reason.trim();
      request.respondedAt = new Date();
      await manager.getRepository(MentorRequest).save(request);

      const interview = await manager.getRepository(Interview).findOne({
        where: { mentorRequestId: request.id },
      });
      if (interview) {
        interview.status = 'CANCELLED';
        await manager.getRepository(Interview).save(interview);
        await manager.getRepository(InterviewSlot).update(
          { interviewId: interview.id },
          { status: 'CANCELLED' },
        );
      }

      return request;
    });
  }

  private async getRequestForUser(
    manager: EntityManager,
    requestId: string,
    userId: string,
  ) {
    const request = await manager.getRepository(MentorRequest).findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Permintaan mentor tidak ditemukan');
    }
    if (request.menteeId !== userId && request.mentorId !== userId) {
      throw new ForbiddenException('Anda tidak berhak melihat permintaan ini');
    }

    const interview = await manager.getRepository(Interview).findOne({
      where: { mentorRequestId: request.id },
    });

    const slots = interview
      ? await manager.getRepository(InterviewSlot).find({
          where: { interviewId: interview.id },
          order: { startAt: 'ASC' },
        })
      : [];

    return { ...request, interview: interview ? { ...interview, slots } : null };
  }

  private async findPassedLevelTwo(
    manager: EntityManager,
    goalId: string,
  ): Promise<GoalLevelProgress | null> {
    const levelTwo = await manager.getRepository(AttributeLevel).find({
      where: { levelNumber: 2 },
      select: { id: true },
    });

    if (levelTwo.length === 0) {
      return null;
    }

    return manager.getRepository(GoalLevelProgress).findOne({
      where: {
        goalId,
        levelId: In(levelTwo.map((level) => level.id)),
        status: In(['PASSED', 'COMPLETED']),
      },
    });
  }

  private validateSlots(slots: SlotInput[]): SlotInput[] {
    const now = Date.now();

    for (const slot of slots) {
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start.getTime() <= now ||
        end.getTime() <= start.getTime()
      ) {
        throw new BadRequestException(
          'Slot harus valid, berada di masa depan, dan endAt setelah startAt',
        );
      }
    }

    return slots;
  }

  private async hasConflict(
    manager: EntityManager,
    firstUserId: string,
    secondUserId: string,
  ): Promise<boolean> {
    return manager.getRepository(ConflictOfInterest).exists({
      where: [
        {
          userId: firstUserId,
          relatedUserId: secondUserId,
          endedAt: IsNull(),
        },
        {
          userId: secondUserId,
          relatedUserId: firstUserId,
          endedAt: IsNull(),
        },
      ],
    });
  }

  private async assertMentorEligible(
    manager: EntityManager,
    mentorId: string,
    attributeId: string,
    menteeId: string,
  ): Promise<void> {
    if (mentorId === menteeId) {
      throw new BadRequestException('Anggota tidak dapat menjadi mentornya sendiri');
    }

    const eligibleAttribute = await manager
      .getRepository(MemberAttribute)
      .createQueryBuilder('memberAttribute')
      .setLock('pessimistic_read')
      .where('memberAttribute.userId = :mentorId', { mentorId })
      .andWhere('memberAttribute.attributeId = :attributeId', { attributeId })
      .andWhere('memberAttribute.status = :status', { status: 'ACTIVE' })
      .andWhere('memberAttribute.isAcceptingMentees = :accepting', {
        accepting: true,
      })
      .andWhere(
        '(memberAttribute.expiresAt IS NULL OR memberAttribute.expiresAt > :now)',
        { now: new Date() },
      )
      .getOne();

    if (!eligibleAttribute) {
      throw new ConflictException(
        'Mentor tidak eligible untuk atribut ini, kedaluwarsa, atau tidak menerima mentee',
      );
    }

    if (await this.hasConflict(manager, menteeId, mentorId)) {
      throw new ConflictException('Terdapat konflik kepentingan dengan mentor');
    }
  }

  private async getMentorCapacity(manager: EntityManager): Promise<number> {
    const rows: Array<{ value: unknown }> = await manager.query(
      'SELECT value FROM system_rules WHERE key = $1 LIMIT 1',
      ['max_active_mentees_per_mentor'],
    );

    const configuredValue = rows[0]?.value;
    const parsed =
      typeof configuredValue === 'number'
        ? configuredValue
        : typeof configuredValue === 'string'
          ? Number(configuredValue)
          : typeof configuredValue === 'object' &&
              configuredValue !== null &&
              'value' in configuredValue
            ? Number((configuredValue as { value: unknown }).value)
            : Number.NaN;

    const capacity = Number.isInteger(parsed) && parsed > 0 ? parsed : 3;
    return capacity;
  }

  private async getMaximumInterviewRounds(
    manager: EntityManager,
  ): Promise<number> {
    const rows: Array<{ value: unknown }> = await manager.query(
      'SELECT value FROM system_rules WHERE key = $1 LIMIT 1',
      ['max_interview_retries'],
    );

    const configuredValue = rows[0]?.value;
    const retries =
      typeof configuredValue === 'number'
        ? configuredValue
        : typeof configuredValue === 'string'
          ? Number(configuredValue)
          : typeof configuredValue === 'object' &&
              configuredValue !== null &&
              'value' in configuredValue
            ? Number((configuredValue as { value: unknown }).value)
            : 2;

    // Nilai rule menyatakan jumlah retry setelah wawancara pertama.
    const normalizedRetries =
      Number.isInteger(retries) && retries >= 0 ? retries : 2;
    return 1 + normalizedRetries;
  }

  private async assertNoScheduledSlotConflict(
    manager: EntityManager,
    menteeId: string,
    mentorId: string,
    slots: SlotInput[],
  ): Promise<void> {
    for (const slot of slots) {
      const rows = await manager.query(
        `
          SELECT id
          FROM interviews
          WHERE status = 'SCHEDULED'
            AND (mentor_id = $1 OR mentee_id = $2)
            AND scheduled_start < $4
            AND scheduled_end > $3
          LIMIT 1
        `,
        [mentorId, menteeId, new Date(slot.startAt), new Date(slot.endAt)],
      );

      if (rows.length > 0) {
        throw new ConflictException(
          'Salah satu slot bertabrakan dengan wawancara terjadwal',
        );
      }
    }
  }
}