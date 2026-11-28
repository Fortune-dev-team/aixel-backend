import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AiMonitoringService {
    constructor(private readonly dataSource: DataSource) {}

    async scoreDistribution() {
        return this.dataSource.query(`
        SELECT
            rubric_id,
            COUNT(*)::int AS grading_count,
            AVG(total_score)::numeric AS average_score,
            AVG(confidence)::numeric AS average_confidence,
            COUNT(*) FILTER (WHERE is_uncertain = true)::int AS uncertain_count,
            date_trunc('day', created_at) AS day
        FROM ai_grading_results
        WHERE created_at >= now() - interval '90 days'
        GROUP BY rubric_id, date_trunc('day', created_at)
        ORDER BY day DESC, rubric_id
        LIMIT 1000
        `);
    }

    async uncertainCases() {
        return this.dataSource.query(`
        SELECT
            gr.id AS grading_result_id,
            gr.attempt_answer_id AS answer_id,
            aa.attempt_id,
            aa.question_id,
            gr.rubric_id,
            gr.ai_provider,
            gr.model,
            gr.total_score,
            gr.confidence,
            gr.reasoning,
            gr.created_at
        FROM ai_grading_results gr
        INNER JOIN attempt_answers aa ON aa.id = gr.attempt_answer_id
        WHERE gr.is_uncertain = true
            AND gr.run_index = (
            SELECT MAX(latest.run_index)
            FROM ai_grading_results latest
            WHERE latest.attempt_answer_id = gr.attempt_answer_id
            )
        ORDER BY gr.created_at DESC
        LIMIT 100
        `);
    }

    async consistencyChecks() {
        return this.dataSource.query(`
        SELECT id, attempt_answer_id, rubric_id, runs, scores, std_dev,
                is_consistent, triggered_by, created_at
        FROM ai_consistency_checks
        ORDER BY created_at DESC
        LIMIT 200
        `);
    }

    async generationRuns() {
        return this.dataSource.query(`
        SELECT id, purpose, requested_by, attribute_id, level_id, provider,
                model, prompt_version, prompt_hash, input_tokens, output_tokens,
                latency_ms, status, error_message, created_at
        FROM ai_generation_runs
        ORDER BY created_at DESC
        LIMIT 200
        `);
    }

    async generationRun(id: string) {
        const [run] = await this.dataSource.query(
        `
            SELECT
            gr.id, gr.purpose, gr.requested_by, gr.attribute_id, gr.level_id,
            gr.provider, gr.model, gr.prompt_version, gr.prompt_hash,
            gr.input_tokens, gr.output_tokens, gr.latency_ms, gr.status,
            gr.error_message, gr.created_at,
            COALESCE(
                json_agg(
                json_build_object(
                    'chunkId', grc.chunk_id,
                    'similarity', grc.similarity,
                    'rank', grc.rank
                )
                ) FILTER (WHERE grc.id IS NOT NULL),
                '[]'
            ) AS sources
            FROM ai_generation_runs gr
            LEFT JOIN ai_generation_run_chunks grc ON grc.run_id = gr.id
            WHERE gr.id = $1
            GROUP BY gr.id
        `,
        [id],
        );

        if (!run) throw new NotFoundException('AI generation run not found');
        return run;
    }

    async gradingRuns() {
        return this.dataSource.query(`
        SELECT
            gr.id,
            gr.attempt_answer_id,
            aa.attempt_id,
            gr.rubric_id,
            gr.run_index,
            gr.ai_provider,
            gr.model,
            gr.prompt_version,
            gr.total_score,
            gr.confidence,
            gr.is_uncertain,
            gr.latency_ms,
            gr.created_at
        FROM ai_grading_results gr
        INNER JOIN attempt_answers aa ON aa.id = gr.attempt_answer_id
        ORDER BY gr.created_at DESC
        LIMIT 200
        `);
    }

    async gradingRun(id: string) {
        const [run] = await this.dataSource.query(
        `
            SELECT
            gr.id,
            gr.attempt_answer_id,
            gr.rubric_id,
            gr.run_index,
            gr.ai_provider,
            gr.model,
            gr.prompt_version,
            gr.total_score,
            gr.confidence,
            gr.is_uncertain,
            gr.reasoning,
            gr.raw_response,
            gr.latency_ms,
            gr.created_at,
            COALESCE(
                json_agg(
                json_build_object(
                    'criterionId', gs.criterion_id,
                    'score', gs.score,
                    'matchedDescriptorId', gs.matched_descriptor_id,
                    'evidence', gs.evidence
                )
                ) FILTER (WHERE gs.id IS NOT NULL),
                '[]'
            ) AS criterion_scores
            FROM ai_grading_results gr
            LEFT JOIN ai_grading_criterion_scores gs
            ON gs.grading_result_id = gr.id
            WHERE gr.id = $1
            GROUP BY gr.id
        `,
        [id],
        );

        if (!run) throw new NotFoundException('AI grading run not found');
        return run;
    }
}