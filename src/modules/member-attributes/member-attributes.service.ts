import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

// SEMENTARA: ganti ke PrismaService setelah modul Prisma disepakati dengan Dev 1
export const PRISMA_CLIENT = 'PRISMA_CLIENT';

const PROFILE_FIELDS = {
  avatar_url: true,
  job_title: true,
  division: true,
  bio: true,
  phone: true,
  timezone: true,
} as const;

@Injectable()
export class MemberAttributesService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        UserProfiles_user_id_item: { select: PROFILE_FIELDS },
      },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const { UserProfiles_user_id_item: profile, ...base } = user;
    return {
      ...base,
      avatar_url: profile?.avatar_url ?? null,
      job_title: profile?.job_title ?? null,
      division: profile?.division ?? null,
      bio: profile?.bio ?? null,
      phone: profile?.phone ?? null,
      timezone: profile?.timezone ?? null,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.userProfiles.upsert({
      where: { user_id: userId },
      update: dto,
      create: { user_id: userId, ...dto },
    });
    return this.getMyProfile(userId);
  }

  async getMyAttributes(userId: string) {
    const rows = await this.prisma.memberAttributes.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        origin: true,
        status: true,
        achieved_at: true,
        valid_from: true,
        expires_at: true,
        is_accepting_mentees: true,
        Attributes_attribute_id: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    const now = new Date();
    return rows.map(({ Attributes_attribute_id: attribute, ...row }) => ({
      ...row,
      attribute,
      // asumsi: kedaluwarsa dihitung dari expires_at, bukan dari kolom status
      is_expired: row.expires_at ? row.expires_at < now : false,
    }));
  }

  async getMyAttributeById(userId: string, id: string, isAdmin = false) {
    const row = await this.prisma.memberAttributes.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        origin: true,
        status: true,
        achieved_at: true,
        valid_from: true,
        expires_at: true,
        is_accepting_mentees: true,
        Attributes_attribute_id: {
          select: { id: true, code: true, name: true, validity_months: true },
        },
      },
    });

    // 404 (bukan 403) supaya keberadaan data milik orang lain tidak bocor
    if (!row || (!isAdmin && row.user_id !== userId)) {
      throw new NotFoundException('Atribut anggota tidak ditemukan');
    }

    const { Attributes_attribute_id: attribute, ...rest } = row;
    return {
      ...rest,
      attribute,
      is_expired: rest.expires_at ? rest.expires_at < new Date() : false,
    };
  }

  async getMyHistory(userId: string) {
    const rows = await this.prisma.goalLevelProgress.findMany({
      where: { Goals_goal_id: { user_id: userId } },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        status: true,
        attempts_used: true,
        best_score: true,
        unlocked_at: true,
        passed_at: true,
        Goals_goal_id: {
          select: {
            id: true,
            status: true,
            started_at: true,
            completed_at: true,
            abandoned_at: true,
            Attributes_attribute_id: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        AttributeLevels_level_id: {
          select: { id: true, level_number: true, title: true },
        },
      },
    });

    return rows.map(
      ({
        Goals_goal_id: goal,
        AttributeLevels_level_id: level,
        ...progress
      }) => ({
        ...progress,
        level,
        goal: goal && {
          id: goal.id,
          status: goal.status,
          started_at: goal.started_at,
          completed_at: goal.completed_at,
          abandoned_at: goal.abandoned_at,
        },
        attribute: goal?.Attributes_attribute_id ?? null,
      }),
    );
  }
}
