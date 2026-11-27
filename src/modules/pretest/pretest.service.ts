import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { SaveAnswersDto } from './dto/save-answers.dto';
import {
  PRETEST_PURPOSE_SELF,
  PRETEST_PURPOSE_SJT,
  PRETEST_STATUS_IN_PROGRESS,
  PRETEST_STATUS_SUBMITTED,
  QUESTION_STATUS_APPROVED,
  SELF_LOW_THRESHOLD,
  SJT_LABEL_FIT,
  SJT_LABEL_LOW,
  SJT_THRESHOLD,
} from './pretest.constants';

// SEMENTARA: ganti ke PrismaService setelah modul Prisma disepakati dengan Dev 1
export const PRISMA_CLIENT = 'PRISMA_CLIENT';

const SESSION_SELECT = {
  id: true,
  status: true,
  started_at: true,
  submitted_at: true,
} as const;

@Injectable()
export class PretestService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  // Mulai sesi baru, atau lanjutkan sesi IN_PROGRESS milik sendiri
  async startOrResume(userId: string) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.pretestSessions.findFirst({
            where: { user_id: userId, status: PRETEST_STATUS_IN_PROGRESS },
            orderBy: { started_at: 'desc' },
            select: SESSION_SELECT,
          });
          if (existing) return { ...existing, resumed: true };

          const created = await tx.pretestSessions.create({
            data: {
              user_id: userId,
              status: PRETEST_STATUS_IN_PROGRESS,
              started_at: new Date(),
            },
            select: SESSION_SELECT,
          });
          return { ...created, resumed: false };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      // P2034 = bentrok transaksi (dua request mulai sesi bersamaan)
      if ((e as { code?: string }).code === 'P2034') {
        throw new ConflictException('Terjadi bentrok permintaan, coba lagi');
      }
      throw e;
    }
  }

  listMySessions(userId: string) {
    return this.prisma.pretestSessions.findMany({
      where: { user_id: userId },
      orderBy: { started_at: 'desc' },
      select: SESSION_SELECT,
    });
  }

  async getMySession(userId: string, id: string) {
    // 404 (bukan 403) untuk sesi milik orang lain
    const session = await this.prisma.pretestSessions.findFirst({
      where: { id, user_id: userId },
      select: SESSION_SELECT,
    });
    if (!session) throw new NotFoundException('Sesi pretest tidak ditemukan');

    const [questions, answers] = await Promise.all([
      this.prisma.questions.findMany({
        where: {
          purpose: { in: [PRETEST_PURPOSE_SELF, PRETEST_PURPOSE_SJT] },
          level_id: null,
          status: QUESTION_STATUS_APPROVED,
          Attributes_attribute_id: { is_active: true, archived_at: null },
        },
        orderBy: [{ attribute_id: 'asc' }, { purpose: 'asc' }, { created_at: 'asc' }],
        // Kunci skor (score_value, is_correct, rationale) SENGAJA tidak dipilih
        select: {
          id: true,
          attribute_id: true,
          purpose: true,
          question_type: true,
          stem: true,
          context_md: true,
          QuestionOptions_question_id_items: {
            orderBy: { sort_order: 'asc' },
            select: { id: true, label: true, option_text: true, sort_order: true },
          },
        },
      }),
      this.prisma.pretestAnswers.findMany({
        where: { session_id: id },
        select: {
          question_id: true,
          option_id: true,
          likert_value: true,
          answer_text: true,
          answered_at: true,
        },
      }),
    ]);

    return {
      ...session,
      questions: questions.map(
        ({ QuestionOptions_question_id_items: options, ...q }) => ({ ...q, options }),
      ),
      answers,
    };
  }

  // Simpan/autosave jawaban. Boleh dipanggil berkali-kali; jawaban yang sama ditimpa, bukan diduplikasi.
  async saveAnswers(userId: string, sessionId: string, dto: SaveAnswersDto) {
    const session = await this.prisma.pretestSessions.findFirst({
      where: { id: sessionId, user_id: userId },
      select: { id: true, status: true },
    });
    if (!session) throw new NotFoundException('Sesi pretest tidak ditemukan');
    if (session.status !== PRETEST_STATUS_IN_PROGRESS) {
      throw new ConflictException('Sesi sudah disubmit, jawaban tidak bisa diubah');
    }

    // tidak boleh ada pasangan (question, option) ganda dalam satu request
    const seen = new Set<string>();
    for (const a of dto.answers) {
      const key = `${a.question_id}:${a.option_id ?? ''}`;
      if (seen.has(key)) {
        throw new BadRequestException('Terdapat jawaban ganda pada permintaan yang sama');
      }
      seen.add(key);
    }

    const questionIds = [...new Set(dto.answers.map((a) => a.question_id))];
    const questions = await this.prisma.questions.findMany({
      where: {
        id: { in: questionIds },
        purpose: { in: [PRETEST_PURPOSE_SELF, PRETEST_PURPOSE_SJT] },
        level_id: null,
        status: QUESTION_STATUS_APPROVED,
        Attributes_attribute_id: { is_active: true, archived_at: null },
      },
      select: {
        id: true,
        purpose: true,
        QuestionOptions_question_id_items: { select: { id: true } },
      },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));

    for (const a of dto.answers) {
      const q = byId.get(a.question_id);
      if (!q) throw new BadRequestException('Soal pretest tidak valid');
      if (q.purpose === PRETEST_PURPOSE_SELF) {
        if (a.option_id) {
          throw new BadRequestException('Soal penilaian diri tidak memakai option_id');
        }
      } else {
        if (!a.option_id) {
          throw new BadRequestException('Soal SJT wajib menyertakan option_id');
        }
        if (!q.QuestionOptions_question_id_items.some((o) => o.id === a.option_id)) {
          throw new BadRequestException('Opsi bukan milik soal tersebut');
        }
      }
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const now = new Date();
          for (const a of dto.answers) {
            // belum ada unique constraint: cari lalu update atau buat
            const existing = await tx.pretestAnswers.findFirst({
              where: {
                session_id: sessionId,
                question_id: a.question_id,
                option_id: a.option_id ?? null,
              },
              select: { id: true },
            });
            if (existing) {
              await tx.pretestAnswers.update({
                where: { id: existing.id },
                data: { likert_value: a.likert_value, answered_at: now },
              });
            } else {
              await tx.pretestAnswers.create({
                data: {
                  session_id: sessionId,
                  question_id: a.question_id,
                  option_id: a.option_id ?? null,
                  likert_value: a.likert_value,
                  answered_at: now,
                },
              });
            }
          }
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      if ((e as { code?: string }).code === 'P2034') {
        throw new ConflictException('Terjadi bentrok permintaan, coba lagi');
      }
      throw e;
    }

    const answers = await this.prisma.pretestAnswers.findMany({
      where: { session_id: sessionId },
      orderBy: { answered_at: 'asc' },
      select: {
        question_id: true,
        option_id: true,
        likert_value: true,
        answered_at: true,
      },
    });
    return { saved: dto.answers.length, answers };
  }

  private num(v: unknown): number | null {
    return v === null || v === undefined ? null : Number(String(v));
  }

  private round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }

  // Hasil per atribut untuk satu sesi, urut rekomendasi (yang disarankan lebih dulu)
  private async getSessionResults(sessionId: string) {
    const rows = await this.prisma.pretestResults.findMany({
      where: { session_id: sessionId },
      orderBy: { recommendation_rank: { sort: 'asc', nulls: 'last' } },
      select: {
        self_score: true,
        sjt_score: true,
        gap_score: true,
        strength_label: true,
        recommendation_rank: true,
        Attributes_attribute_id: { select: { id: true, code: true, name: true } },
      },
    });
    return rows.map(({ Attributes_attribute_id: attribute, ...r }) => ({
      attribute,
      self_score: this.num(r.self_score),
      sjt_score: this.num(r.sjt_score),
      gap_score: this.num(r.gap_score),
      strength_label: r.strength_label,
      recommended: r.recommendation_rank !== null,
      recommendation_rank: r.recommendation_rank,
    }));
  }

  // Submit: hitung skor di server, simpan hasil, kunci sesi. Hanya merekomendasikan; tidak membuat goal.
  async submit(userId: string, sessionId: string) {
    const session = await this.prisma.pretestSessions.findFirst({
      where: { id: sessionId, user_id: userId },
      select: { id: true, status: true },
    });
    if (!session) throw new NotFoundException('Sesi pretest tidak ditemukan');
    if (session.status !== PRETEST_STATUS_IN_PROGRESS) {
      throw new ConflictException('Sesi sudah disubmit');
    }

    const [questions, answers] = await Promise.all([
      this.prisma.questions.findMany({
        where: {
          purpose: { in: [PRETEST_PURPOSE_SELF, PRETEST_PURPOSE_SJT] },
          level_id: null,
          status: QUESTION_STATUS_APPROVED,
          Attributes_attribute_id: { is_active: true, archived_at: null },
        },
        select: {
          id: true,
          attribute_id: true,
          purpose: true,
          QuestionOptions_question_id_items: {
            select: { id: true, score_value: true },
          },
        },
      }),
      this.prisma.pretestAnswers.findMany({
        where: { session_id: sessionId },
        select: { id: true, question_id: true, option_id: true, likert_value: true },
      }),
    ]);

    if (questions.length === 0) {
      throw new BadRequestException('Belum ada soal pretest yang tersedia');
    }

    type Acc = { self: number[]; sjt: number[] };
    const perAttribute = new Map<string, Acc>();
    const answerScores: { id: string; score: number }[] = [];
    let incomplete = 0;

    for (const q of questions) {
      if (!q.attribute_id) continue;
      const acc = perAttribute.get(q.attribute_id) ?? { self: [], sjt: [] };
      perAttribute.set(q.attribute_id, acc);

      if (q.purpose === PRETEST_PURPOSE_SELF) {
        const a = answers.find((x) => x.question_id === q.id && x.option_id === null);
        if (!a || a.likert_value === null) {
          incomplete++;
          continue;
        }
        acc.self.push(a.likert_value);
      } else {
        const diffs: number[] = [];
        let complete = q.QuestionOptions_question_id_items.length > 0;
        for (const o of q.QuestionOptions_question_id_items) {
          const a = answers.find((x) => x.question_id === q.id && x.option_id === o.id);
          const key = this.num(o.score_value);
          if (!a || a.likert_value === null || key === null) {
            complete = false;
            break;
          }
          const diff = Math.abs(a.likert_value - key);
          diffs.push(diff);
          answerScores.push({ id: a.id, score: this.round4(1 - diff / 4) });
        }
        if (!complete) {
          incomplete++;
          continue;
        }
        const mean = diffs.reduce((x, y) => x + y, 0) / diffs.length;
        acc.sjt.push(1 - mean / 4);
      }
    }

    if (incomplete > 0) {
      throw new BadRequestException(
        `Jawaban belum lengkap: ${incomplete} dari ${questions.length} soal belum terjawab penuh`,
      );
    }

    const avg = (xs: number[]) =>
      xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : null;

    const computed = [...perAttribute.entries()].map(([attributeId, acc]) => {
      const self = avg(acc.self);
      const sjt = avg(acc.sjt);
      const label =
        sjt === null ? null : sjt >= SJT_THRESHOLD ? SJT_LABEL_FIT : SJT_LABEL_LOW;
      const recommended =
        (self !== null && self <= SELF_LOW_THRESHOLD) || label === SJT_LABEL_LOW;
      const gap = self !== null && sjt !== null ? (self - 1) / 4 - sjt : null;
      return { attributeId, self, sjt, gap, label, recommended };
    });

    const ranked = computed
      .filter((c) => c.recommended)
      .sort((a, b) => (a.sjt ?? 1) - (b.sjt ?? 1) || (a.self ?? 5) - (b.self ?? 5));
    const rankOf = new Map(ranked.map((c, i) => [c.attributeId, i + 1]));

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const fresh = await tx.pretestSessions.findFirst({
            where: { id: sessionId, user_id: userId, status: PRETEST_STATUS_IN_PROGRESS },
            select: { id: true },
          });
          if (!fresh) throw new ConflictException('Sesi sudah disubmit');

          for (const a of answerScores) {
            await tx.pretestAnswers.update({
              where: { id: a.id },
              data: { score: a.score },
            });
          }
          await tx.pretestResults.createMany({
            data: computed.map((c) => ({
              session_id: sessionId,
              attribute_id: c.attributeId,
              self_score: c.self === null ? null : this.round4(c.self),
              sjt_score: c.sjt === null ? null : this.round4(c.sjt),
              gap_score: c.gap === null ? null : this.round4(c.gap),
              strength_label: c.label,
              recommendation_rank: rankOf.get(c.attributeId) ?? null,
            })),
          });
          await tx.pretestSessions.update({
            where: { id: sessionId },
            data: { status: PRETEST_STATUS_SUBMITTED, submitted_at: new Date() },
          });
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      if ((e as { code?: string }).code === 'P2034') {
        throw new ConflictException('Terjadi bentrok permintaan, coba lagi');
      }
      throw e;
    }

    return {
      session_id: sessionId,
      status: PRETEST_STATUS_SUBMITTED,
      results: await this.getSessionResults(sessionId),
    };
  }

  // Hasil dari sesi SUBMITTED terbaru milik sendiri
  async getLatestResult(userId: string) {
    const session = await this.prisma.pretestSessions.findFirst({
      where: { user_id: userId, status: PRETEST_STATUS_SUBMITTED },
      orderBy: { submitted_at: 'desc' },
      select: { id: true, submitted_at: true },
    });
    if (!session) throw new NotFoundException('Belum ada hasil pretest');

    return {
      session_id: session.id,
      submitted_at: session.submitted_at,
      results: await this.getSessionResults(session.id),
    };
  }
}
