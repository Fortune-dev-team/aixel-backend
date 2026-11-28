import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKnowledgeRag1760000000000 implements MigrationInterface {
    name = 'CreateKnowledgeRag1760000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS knowledge_sources (
            id uuid PRIMARY KEY,
            title varchar(255) NOT NULL,
            original_filename varchar(255) NOT NULL,
            mime_type varchar(120) NOT NULL,
            storage_key text NOT NULL UNIQUE,
            attribute_id uuid,
            level_id uuid,
            status varchar(30) NOT NULL DEFAULT 'QUEUED',
            error_message text,
            created_by uuid,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT knowledge_sources_status_check
            CHECK (status IN ('QUEUED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED'))
        )
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_sources_scope_status
        ON knowledge_sources (attribute_id, level_id, status)
        `);

        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            id uuid PRIMARY KEY,
            source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
            chunk_index integer NOT NULL,
            content text NOT NULL,
            embedding vector(768) NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            UNIQUE (source_id, chunk_index)
        )
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
        ON knowledge_chunks (source_id)
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
        ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
        `);

        await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS ai_runs (
            id uuid PRIMARY KEY,
            run_type varchar(30) NOT NULL,
            status varchar(30) NOT NULL,
            provider varchar(40),
            model varchar(160),
            attribute_id uuid,
            level_id uuid,
            input_hash varchar(64),
            output_json jsonb,
            source_chunk_ids uuid[] NOT NULL DEFAULT '{}',
            confidence real,
            error_message text,
            duration_ms integer,
            created_by uuid,
            created_at timestamptz NOT NULL DEFAULT now(),
            completed_at timestamptz
        )
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_runs_type_status_created
        ON ai_runs (run_type, status, created_at DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS ai_runs`);
        await queryRunner.query(`DROP TABLE IF EXISTS knowledge_chunks`);
        await queryRunner.query(`DROP TABLE IF EXISTS knowledge_sources`);
        // Не видаляємо extension vector: sepertinya bisa dipakai domain lain juga.
    }
}