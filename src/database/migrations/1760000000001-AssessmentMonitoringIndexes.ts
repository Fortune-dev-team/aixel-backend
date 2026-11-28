import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssessmentMonitoringIndexes1760000000001
    implements MigrationInterface
{
    name = 'AssessmentMonitoringIndexes1760000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_grading_answer_run
        ON ai_grading_results (attempt_answer_id, run_index DESC)
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_grading_uncertain_created
        ON ai_grading_results (created_at DESC)
        WHERE is_uncertain = true
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_consistency_created
        ON ai_consistency_checks (created_at DESC)
        `);

        await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_generation_created
        ON ai_generation_runs (created_at DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_generation_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_consistency_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_grading_uncertain_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_ai_grading_answer_run`);
    }
}