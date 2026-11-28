import {
    Injectable,
    NotFoundException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID, createHash } from 'node:crypto';
import { toSql } from 'pgvector';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

import { AiProviderService } from '../../ai/providers/ai-provider.service';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { SearchKnowledgeDto } from './dto/search-knowledge.dto';

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
]);

const CHUNK_SIZE = 3_500;
const CHUNK_OVERLAP = 400;

interface KnowledgeSourceRow {
    id: string;
    storage_key: string;
    mime_type: string;
}

interface SearchChunkRow {
    id: string;
    source_id: string;
    content: string;
    distance: number;
}

@Injectable()
export class KnowledgeBaseService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly ai: AiProviderService,
        private readonly storage: ObjectStorageService,
    ) {}

    async uploadDocument(input: {
        file: Express.Multer.File;
        title: string;
        attributeId?: string;
        levelId?: string;
        userId: string;
        queueIngestion: (sourceId: string) => Promise<void>;
    }) {
        const { file } = input;

        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new UnsupportedMediaTypeException(
            'Only PDF, DOCX, and plain-text files are supported',
        );
        }

        const sourceId = randomUUID();
        const storageKey = `knowledge/${sourceId}/${file.originalname}`;

        await this.storage.put(storageKey, file.buffer, file.mimetype);

        try {
        await this.dataSource.query(
            `
            INSERT INTO knowledge_sources
                (id, title, original_filename, mime_type, storage_key,
                attribute_id, level_id, status, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'QUEUED', $8)
            `,
            [
            sourceId,
            input.title,
            file.originalname,
            file.mimetype,
            storageKey,
            input.attributeId ?? null,
            input.levelId ?? null,
            input.userId,
            ],
        );

        await input.queueIngestion(sourceId);
        } catch (error) {
        await this.dataSource.query(
            `UPDATE knowledge_sources SET status = 'FAILED', error_message = $2, updated_at = now() WHERE id = $1`,
            [
            sourceId,
            error instanceof Error ? error.message.slice(0, 1000) : 'Queue failed',
            ],
        ).catch(() => undefined);

        throw error;
        }

        return { id: sourceId, status: 'QUEUED' as const };
    }

    async processIngestion(sourceId: string): Promise<void> {
        const [source] = (await this.dataSource.query(
        `SELECT id, storage_key, mime_type FROM knowledge_sources WHERE id = $1`,
        [sourceId],
        )) as KnowledgeSourceRow[];

        if (!source) throw new NotFoundException('Knowledge source not found');

        await this.dataSource.query(
        `UPDATE knowledge_sources SET status = 'PROCESSING', error_message = NULL, updated_at = now() WHERE id = $1`,
        [sourceId],
        );

        try {
        const file = await this.storage.get(source.storage_key);
        const text = await this.extractText(file, source.mime_type);
        const chunks = this.chunkText(text);

        if (chunks.length === 0) {
            throw new Error('No extractable text was found in the document');
        }

        // Reprocessing replaces chunk data atomically at the source level.
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`DELETE FROM knowledge_chunks WHERE source_id = $1`, [
            sourceId,
            ]);

            for (let index = 0; index < chunks.length; index += 1) {
            const embedding = await this.ai.embed(chunks[index]);

            await manager.query(
                `
                INSERT INTO knowledge_chunks
                    (id, source_id, chunk_index, content, embedding)
                VALUES ($1, $2, $3, $4, $5::vector)
                `,
                [
                randomUUID(),
                sourceId,
                index,
                chunks[index],
                toSql(embedding.vector),
                ],
            );
            }

            await manager.query(
            `UPDATE knowledge_sources SET status = 'READY', error_message = NULL, updated_at = now() WHERE id = $1`,
            [sourceId],
            );
        });
        } catch (error) {
        await this.dataSource.query(
            `UPDATE knowledge_sources SET status = 'FAILED', error_message = $2, updated_at = now() WHERE id = $1`,
            [
            sourceId,
            error instanceof Error ? error.message.slice(0, 1000) : 'Ingestion failed',
            ],
        );

        throw error;
        }
    }

    async searchAndAnswer(dto: SearchKnowledgeDto, userId: string) {
        const queryEmbedding = await this.ai.embed(dto.query);

        const rows = (await this.dataSource.query(
        `
            SELECT
            kc.id,
            kc.source_id,
            kc.content,
            kc.embedding <=> $1::vector AS distance
            FROM knowledge_chunks kc
            INNER JOIN knowledge_sources ks ON ks.id = kc.source_id
            WHERE ks.status = 'READY'
            AND ks.attribute_id = $2
            AND ks.level_id = $3
            ORDER BY kc.embedding <=> $1::vector
            LIMIT $4
        `,
        [
            toSql(queryEmbedding.vector),
            dto.attributeId,
            dto.levelId,
            dto.topK ?? 5,
        ],
        )) as SearchChunkRow[];

        const runId = randomUUID();
        const inputHash = createHash('sha256').update(dto.query).digest('hex');

        if (!rows.length) {
        await this.saveRun({
            id: runId,
            userId,
            dto,
            status: 'COMPLETED',
            inputHash,
            output: { answer: 'Belum ada materi yang relevan di knowledge base.' },
            sourceChunkIds: [],
        });

        return {
            runId,
            answer: 'Belum ada materi yang relevan di knowledge base.',
            citations: [],
        };
        }

        const context = rows
        .map(
            (row, index) =>
            `[S${index + 1}; chunk=${row.id}; source=${row.source_id}]\n${row.content}`,
        )
        .join('\n\n');

        const prompt = [
        'Jawab pertanyaan hanya berdasarkan konteks yang disediakan.',
        'Jangan gunakan atau mengarang sumber eksternal.',
        'Jika konteks tidak cukup, nyatakan bahwa informasi tidak ditemukan.',
        'Sertakan referensi [S1], [S2], dan seterusnya pada klaim yang didukung.',
        '',
        '<CONTEXT>',
        context,
        '</CONTEXT>',
        '',
        `Pertanyaan: ${dto.query}`,
        ].join('\n');

        const generated = await this.ai.generate(prompt);
        const confidence =
        rows.length >= 3
            ? 0.8
            : rows.length === 2
            ? 0.65
            : 0.45;

        await this.saveRun({
        id: runId,
        userId,
        dto,
        status: 'COMPLETED',
        inputHash,
        output: {
            answer: generated.text,
            provider: generated.provider,
            model: generated.model,
        },
        sourceChunkIds: rows.map((row) => row.id),
        confidence,
        });

        return {
        runId,
        answer: generated.text,
        confidence,
        citations: rows.map((row, index) => ({
            ref: `S${index + 1}`,
            sourceId: row.source_id,
            chunkId: row.id,
            excerpt: row.content.slice(0, 500),
            distance: Number(row.distance),
        })),
        };
    }

    private async saveRun(input: {
        id: string;
        userId: string;
        dto: SearchKnowledgeDto;
        status: string;
        inputHash: string;
        output: Record<string, unknown>;
        sourceChunkIds: string[];
        confidence?: number;
    }) {
        await this.dataSource.query(
        `
            INSERT INTO ai_runs
            (id, run_type, status, provider, model, attribute_id, level_id,
            input_hash, output_json, source_chunk_ids, confidence, created_by,
            completed_at)
            VALUES ($1, 'RAG_QUERY', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
        `,
        [
            input.id,
            input.status,
            this.ai.llmProviderName(),
            this.ai.llmModelName(),
            input.dto.attributeId,
            input.dto.levelId,
            input.inputHash,
            JSON.stringify(input.output),
            input.sourceChunkIds,
            input.confidence ?? null,
            input.userId,
        ],
        );
    }

    private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
        if (mimeType === 'text/plain') return buffer.toString('utf8');

        if (mimeType === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        try {
            const result = await parser.getText();
            return result.text ?? '';
        } finally {
            await parser.destroy();
        }
        }

        if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
        }

        throw new UnsupportedMediaTypeException('Unsupported document type');
    }

    private chunkText(text: string): string[] {
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (!normalized) return [];

        const chunks: string[] = [];
        let start = 0;

        while (start < normalized.length) {
        const end = Math.min(start + CHUNK_SIZE, normalized.length);
        const chunk = normalized.slice(start, end).trim();

        if (chunk) chunks.push(chunk);
        if (end === normalized.length) break;

        start = Math.max(end - CHUNK_OVERLAP, start + 1);
        }

        return chunks;
    }
    async getSourceStatus(id: string) {
        const [source] = await this.dataSource.query(
        `
            SELECT id, title, original_filename, mime_type, attribute_id, level_id,
                status, error_message, created_at, updated_at
            FROM knowledge_sources
            WHERE id = $1
        `,
        [id],
        );

        if (!source) throw new NotFoundException('Knowledge source not found');
        return source;
    }

    async getAiRun(id: string) {
        const [run] = await this.dataSource.query(
        `
            SELECT id, run_type, status, provider, model, attribute_id, level_id,
                output_json, source_chunk_ids, confidence, error_message,
                duration_ms, created_at, completed_at
            FROM ai_runs
            WHERE id = $1
        `,
        [id],
        );

        if (!run) throw new NotFoundException('AI run not found');
        return run;
    }
}