import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, DataSource, Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { AttributeLevel } from '../course-materials/entities/attribute-level.entity';
import { AiGenerationRun } from './entities/ai-generation-run.entity';
import { AiGenerationRunChunk } from './entities/ai-generation-run-chunk.entity';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { GenerateQuestionDto } from './dto/generate-question.dto';

import { AiProviderService } from '../../ai/providers/ai-provider.service';

interface RetrievedKnowledgeChunk {
  id: string;
  source_id: string;
  content: string;
  distance: number;
}

@Injectable()
export class QuestionBankService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,

    @InjectRepository(AttributeLevel)
    private readonly attributeLevelRepository: Repository<AttributeLevel>,

    private readonly dataSource: DataSource,

    private readonly aiProviderService: AiProviderService,
  ) {}

  async create(dto: CreateQuestionDto, user: AuthenticatedUser) {
    return this.dataSource.transaction(async (manager) => {
      const questionRepo = manager.getRepository(Question);
      const optionRepo = manager.getRepository(QuestionOption);

      const options = dto.options ?? [];

      await this.validateQuestionFormat(
        dto.levelId ?? null,
        dto.stem,
        dto.contextMd ?? null,
        options,
      );

      const question = questionRepo.create({
        id: crypto.randomUUID(),
        attributeId: dto.attributeId ?? null,
        levelId: dto.levelId ?? null,
        purpose: dto.purpose ?? null,
        questionType: dto.questionType ?? null,
        stem: dto.stem,
        contextMd: dto.contextMd ?? null,
        difficulty: dto.difficulty ?? null,
        rubricId: dto.rubricId ?? null,
        origin: dto.origin ?? null,
        status: 'DRAFT',
        generationRunId: null,
        createdBy: user.id,
      });

      const savedQuestion = await questionRepo.save(question);

      const newOptions = options.map((option) =>
        optionRepo.create({
          id: crypto.randomUUID(),
          questionId: savedQuestion.id,
          label: option.label,
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          scoreValue: option.scoreValue ?? null,
          rationale: option.rationale ?? null,
          sortOrder: option.sortOrder,
        }),
      );

      const savedOptions = newOptions.length
        ? await optionRepo.save(newOptions)
        : [];

      return {
        ...savedQuestion,
        options: savedOptions,
      };
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    return this.dataSource.transaction(async (manager) => {
      const questionRepo = manager.getRepository(Question);
      const optionRepo = manager.getRepository(QuestionOption);

      const question = await questionRepo.findOneBy({ id });

      if (!question) {
        throw new NotFoundException('Question tidak ditemukan');
      }

      const existingOptions = await optionRepo.find({
        where: { questionId: id },
        order: { sortOrder: 'ASC' },
      });

      const effectiveLevelId = dto.levelId ?? question.levelId;
      const effectiveStem = dto.stem ?? question.stem;
      const effectiveContextMd = dto.contextMd ?? question.contextMd;
      const effectiveOptions = dto.options ?? existingOptions;

      await this.validateQuestionFormat(
        effectiveLevelId,
        effectiveStem,
        effectiveContextMd,
        effectiveOptions,
      );

      const { options, ...questionData } = dto;

      const updateData = Object.fromEntries(
        Object.entries(questionData).filter(([, value]) => value !== undefined),
      );

      Object.assign(question, updateData);

      const updatedQuestion = await questionRepo.save(question);

      if (options === undefined) {
        return {
          ...updatedQuestion,
          options: existingOptions,
        };
      }

      await optionRepo.delete({ questionId: id });

      const newOptions = options.map((option) =>
        optionRepo.create({
          id: crypto.randomUUID(),
          questionId: id,
          label: option.label,
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          scoreValue: option.scoreValue ?? null,
          rationale: option.rationale ?? null,
          sortOrder: option.sortOrder,
        }),
      );

      const savedOptions = newOptions.length
        ? await optionRepo.save(newOptions)
        : [];

      return {
        ...updatedQuestion,
        options: savedOptions,
      };
    });
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.questionRepository.findAndCount({
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const questionIds = data.map((question) => question.id);

    const options = questionIds.length
      ? await this.questionOptionRepository.find({
          where: {
            questionId: In(questionIds),
          },
          order: {
            sortOrder: 'ASC',
          },
        })
      : [];

    const questionWithOptions = data.map((question) => ({
      ...question,
      options: options.filter((option) => option.questionId === question.id),
    }));

    return {
      data: questionWithOptions,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async archive(id: string) {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    question.status = 'ARCHIVED';

    await this.questionRepository.save(question);

    return {
      message: 'Question archived successfully',
      data: question,
    };
  }

  async approve(id: string) {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT questions can be approved');
    }

    const options = await this.questionOptionRepository.find({
      where: { questionId: id },
      order: { sortOrder: 'ASC' },
    });

    await this.validateQuestionFormat(
      question.levelId,
      question.stem,
      question.contextMd,
      options,
    );

    question.status = 'APPROVED';

    await this.questionRepository.save(question);

    return {
      message: 'Question approved successfully',
      data: question,
    };
  }

  async retire(id: string) {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED questions can be retired');
    }

    question.status = 'RETIRED';

    await this.questionRepository.save(question);

    return {
      message: 'Question retired successfully',
      data: question,
    };
  }

  private async generateWithAi(dto: GenerateQuestionDto) {
    const level = await this.attributeLevelRepository.findOne({
      where: { id: dto.levelId },
    });

    if (!level) {
      throw new NotFoundException('Attribute level tidak ditemukan');
    }

    if (level.levelNumber !== 1 && level.levelNumber !== 2) {
      throw new BadRequestException(
        'AI Question Generation hanya mendukung Level 1 dan Level 2',
      );
    }

    const chunks = await this.retrieveKnowledgeChunks(dto);

    if (chunks.length === 0) {
      throw new BadRequestException(
        'Belum ada knowledge chunk READY yang relevan untuk atribut dan level ini',
      );
    }

    const knowledgeContext = chunks
      .map((chunk, index) => `Referensi ${index + 1}:\n${chunk.content}`)
      .join('\n\n');

    const questionFormat =
      level.levelNumber === 1
        ? `
Buat soal pilihan ganda.
Setiap soal wajib memiliki:
- questionType: "multiple_choice"
- stem: teks pertanyaan
- contextMd: null
- difficulty: "easy", "medium", atau "hard"
- options: tepat 3 pilihan
Setiap pilihan memiliki:
- label: "A", "B", atau "C"
- optionText: teks pilihan
- isCorrect: boolean
- scoreValue: angka dalam bentuk string
- rationale: alasan pilihan tersebut benar atau salah
- sortOrder: 1, 2, atau 3
`
        : `
Buat soal studi kasus tertulis.
Setiap soal wajib memiliki:
- questionType: "case_study"
- contextMd: skenario atau teks studi kasus
- stem: instruksi atau pertanyaan berdasarkan kasus
- difficulty: "easy", "medium", atau "hard"
- options: array kosong
`;

    const prompt = `
Kamu adalah AI pembuat soal pembelajaran AIXEL.

Buat tepat ${dto.count} soal untuk:
Attribute ID: ${dto.attributeId}
Level: ${level.levelNumber}
Purpose: ${dto.purpose}

Gunakan hanya referensi Knowledge Base berikut.
Jangan menambahkan fakta dari luar referensi.

REFERENSI:
${knowledgeContext}

ATURAN FORMAT:
${questionFormat}

Keluarkan hanya JSON valid dengan struktur:
{
  "questions": [
    {
      "questionType": "...",
      "stem": "...",
      "contextMd": null,
      "difficulty": "...",
      "options": []
    }
  ]
}
`;

    const result = await this.aiProviderService.generate(prompt);

    const parsed = JSON.parse(
      result.text.replace(/^```(?:json)?\s*|\s*```$/g, ''),
    );

    if (
      !parsed.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== dto.count
    ) {
      throw new BadRequestException(
        `AI harus menghasilkan tepat ${dto.count} soal`,
      );
    }

    for (const question of parsed.questions) {
      await this.validateQuestionFormat(
        dto.levelId,
        question.stem,
        question.contextMd ?? null,
        question.options ?? [],
      );
    }

    return {
      provider: result.provider,
      model: result.model,
      chunks,
      questions: parsed.questions,
    };
  }

  private async retrieveKnowledgeChunks(dto: GenerateQuestionDto) {
    const embedding = await this.aiProviderService.embed(dto.purpose);

    const vector = `[${embedding.vector.join(',')}]`;

    const chunks: RetrievedKnowledgeChunk[] = await this.dataSource.query(
      `
        SELECT
          kc.id,
          kc.source_id,
          kc.content,
          kc.embedding <=> $1::vector AS distance
        FROM knowledge_chunks kc
        INNER JOIN knowledge_sources ks
          ON ks.id = kc.source_id
        WHERE ks.status = 'READY'
          AND ks.attribute_id = $2
          AND ks.level_id = $3
        ORDER BY kc.embedding <=> $1::vector
        LIMIT $4
      `,
      [vector, dto.attributeId, dto.levelId, 5],
    );

    return chunks;
  }
  async generate(dto: GenerateQuestionDto, user: AuthenticatedUser) {
    const startTime = Date.now();

    const generated = await this.generateWithAi(dto);

    return this.dataSource.transaction(async (manager) => {
      const runRepo = manager.getRepository(AiGenerationRun);
      const runChunkRepo = manager.getRepository(AiGenerationRunChunk);
      const questionRepo = manager.getRepository(Question);
      const optionRepo = manager.getRepository(QuestionOption);

      const runId = crypto.randomUUID();

      const run = runRepo.create({
        id: runId,
        purpose: dto.purpose,
        requestedBy: user.id,
        attributeId: dto.attributeId,
        levelId: dto.levelId,
        provider: generated.provider,
        model: generated.model,
        promptVersion: 'v1',
        promptHash: null,
        inputTokens: null,
        outputTokens: null,
        latencyMs: Date.now() - startTime,
        status: 'COMPLETED',
        errorMessage: null,
      });

      await runRepo.save(run);

      const runChunks = generated.chunks.map((chunk, index) =>
        runChunkRepo.create({
          id: crypto.randomUUID(),
          runId,
          chunkId: chunk.id,
          similarity: (1 - Number(chunk.distance)).toString(),
          rank: index + 1,
        }),
      );

      if (runChunks.length > 0) {
        await runChunkRepo.save(runChunks);
      }

      const savedQuestions = [];

      for (const item of generated.questions as {
        questionType: string;
        stem: string;
        contextMd?: string | null;
        difficulty: string;
        options: {
          label: string;
          optionText: string;
          isCorrect: boolean;
          scoreValue?: string | null;
          rationale?: string | null;
          sortOrder: number;
        }[];
      }[]) {
        const question = questionRepo.create({
          id: crypto.randomUUID(),
          attributeId: dto.attributeId,
          levelId: dto.levelId,
          purpose: dto.purpose,
          questionType: item.questionType,
          stem: item.stem,
          contextMd: item.contextMd ?? null,
          difficulty: item.difficulty,
          rubricId: null,
          origin: null,
          status: 'DRAFT',
          generationRunId: runId,
          createdBy: user.id,
        });

        const savedQuestion = await questionRepo.save(question);

        const options = (item.options ?? []).map((option) =>
          optionRepo.create({
            id: crypto.randomUUID(),
            questionId: savedQuestion.id,
            label: option.label,
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            scoreValue: option.scoreValue ?? null,
            rationale: option.rationale ?? null,
            sortOrder: option.sortOrder,
          }),
        );

        const savedOptions = options.length
          ? await optionRepo.save(options)
          : [];

        savedQuestions.push({
          ...savedQuestion,
          options: savedOptions,
        });
      }

      return {
        message: 'Question generation berhasil',
        generationRun: run,
        data: savedQuestions,
      };
    });
  }

  private async validateQuestionFormat(
    levelId: string | null,
    stem: string | null,
    contextMd: string | null,
    options: { isCorrect: boolean | null }[],
  ) {
    if (!levelId) {
      throw new BadRequestException('Level ID wajib diisi');
    }

    const level = await this.attributeLevelRepository.findOne({
      where: { id: levelId },
    });

    if (!level) {
      throw new NotFoundException('Attribute level tidak ditemukan');
    }

    if (!stem?.trim()) {
      throw new BadRequestException('Stem pertanyaan wajib diisi');
    }

    if (level.levelNumber === 1) {
      if (options.length !== 3) {
        throw new BadRequestException(
          'Level 1 wajib memiliki tepat 3 pilihan jawaban',
        );
      }

      const correctAnswers = options.filter((option) => option.isCorrect);

      if (correctAnswers.length !== 1) {
        throw new BadRequestException(
          'Level 1 wajib memiliki tepat 1 jawaban benar',
        );
      }
    } else if (level.levelNumber === 2) {
      if (!contextMd?.trim()) {
        throw new BadRequestException(
          'Level 2 wajib memiliki teks studi kasus pada contextMd',
        );
      }

      if (options.length > 0) {
        throw new BadRequestException(
          'Level 2 tidak menggunakan pilihan jawaban',
        );
      }
    } else {
      throw new BadRequestException(
        'Question Bank hanya mendukung Level 1 dan Level 2',
      );
    }

    return level;
  }
}
