CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "system_role" TEXT,
    "status" TEXT,
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "avatar_url" TEXT,
    "job_title" TEXT,
    "division" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "timezone" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "family_id" UUID,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" TEXT,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_categories" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "attribute_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "validity_months" INTEGER,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_levels" (
    "id" UUID NOT NULL,
    "attribute_id" UUID,
    "level_number" INTEGER,
    "level_type" TEXT,
    "title" TEXT,
    "description" TEXT,
    "miller_stage" TEXT,
    "pass_score" DECIMAL(65,30),
    "max_retry" INTEGER,
    "question_count" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attribute_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_indicators" (
    "id" UUID NOT NULL,
    "level_id" UUID,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "level_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "attribute_id" UUID,
    "level_id" UUID,
    "title" TEXT,
    "source_type" TEXT,
    "origin" TEXT,
    "url" TEXT,
    "language" TEXT,
    "file_key" TEXT,
    "file_mime" TEXT,
    "status" TEXT,
    "ingestion_error" TEXT,
    "link_status" TEXT,
    "last_link_checked_at" TIMESTAMPTZ(6),
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "source_id" UUID,
    "attribute_id" UUID,
    "level_id" UUID,
    "chunk_index" INTEGER DEFAULT 0,
    "content" TEXT,
    "token_count" INTEGER,
    "embedding" vector,
    "embedding_model" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_materials" (
    "id" UUID NOT NULL,
    "level_id" UUID,
    "title" TEXT,
    "summary_md" TEXT,
    "status" TEXT,
    "origin" TEXT,
    "version" INTEGER DEFAULT 1,
    "generation_run_id" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_material_sources" (
    "id" UUID NOT NULL,
    "material_id" UUID,
    "source_id" UUID,
    "chunk_id" UUID,
    "citation_note" TEXT,

    CONSTRAINT "course_material_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "goal_id" UUID,
    "material_id" UUID,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "material_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID,
    "material_id" UUID,
    "source_id" UUID,
    "reason" TEXT,
    "status" TEXT,
    "resolved_by" UUID,
    "resolution_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "material_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubrics" (
    "id" UUID NOT NULL,
    "attribute_id" UUID,
    "level_id" UUID,
    "rubric_type" TEXT,
    "name" TEXT,
    "version" INTEGER DEFAULT 1,
    "status" TEXT,
    "origin" TEXT,
    "generation_run_id" UUID,
    "scale_max" INTEGER,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_criteria" (
    "id" UUID NOT NULL,
    "rubric_id" UUID,
    "name" TEXT,
    "description" TEXT,
    "weight" DECIMAL(65,30),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rubric_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_descriptors" (
    "id" UUID NOT NULL,
    "criterion_id" UUID,
    "score" INTEGER,
    "label" TEXT,
    "descriptor" TEXT,

    CONSTRAINT "rubric_descriptors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_rules" (
    "key" TEXT NOT NULL,
    "value" JSONB,
    "value_type" TEXT,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "system_rules_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "attribute_id" UUID,
    "level_id" UUID,
    "purpose" TEXT,
    "question_type" TEXT,
    "stem" TEXT,
    "context_md" TEXT,
    "difficulty" TEXT,
    "rubric_id" UUID,
    "origin" TEXT,
    "status" TEXT,
    "generation_run_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID,
    "label" TEXT,
    "option_text" TEXT,
    "is_correct" BOOLEAN,
    "score_value" DECIMAL(65,30),
    "rationale" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_chunks" (
    "id" UUID NOT NULL,
    "question_id" UUID,
    "chunk_id" UUID,

    CONSTRAINT "question_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pretest_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "status" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),

    CONSTRAINT "pretest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pretest_answers" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "question_id" UUID,
    "option_id" UUID,
    "likert_value" INTEGER,
    "answer_text" TEXT,
    "score" DECIMAL(65,30),
    "answered_at" TIMESTAMPTZ(6),

    CONSTRAINT "pretest_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pretest_results" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "attribute_id" UUID,
    "self_score" DECIMAL(65,30),
    "sjt_score" DECIMAL(65,30),
    "gap_score" DECIMAL(65,30),
    "strength_label" TEXT,
    "recommendation_rank" INTEGER,

    CONSTRAINT "pretest_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "attribute_id" UUID,
    "status" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "abandoned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_level_progress" (
    "id" UUID NOT NULL,
    "goal_id" UUID,
    "level_id" UUID,
    "status" TEXT,
    "interview_phase" TEXT,
    "attempts_used" INTEGER DEFAULT 0,
    "interview_rounds_used" INTEGER DEFAULT 0,
    "best_score" DECIMAL(65,30),
    "cooldown_until" TIMESTAMPTZ(6),
    "unlocked_at" TIMESTAMPTZ(6),
    "passed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goal_level_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_attempts" (
    "id" UUID NOT NULL,
    "goal_level_progress_id" UUID,
    "user_id" UUID,
    "level_id" UUID,
    "attempt_number" INTEGER,
    "status" TEXT,
    "rubric_id" UUID,
    "total_score" DECIMAL(65,30),
    "max_score" DECIMAL(65,30),
    "score_percent" DECIMAL(65,30),
    "passed" BOOLEAN,
    "is_uncertain" BOOLEAN,
    "feedback_summary" TEXT,
    "review_recommendations" JSONB,
    "generation_run_id" UUID,
    "started_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "graded_at" TIMESTAMPTZ(6),

    CONSTRAINT "level_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID,
    "question_id" UUID,
    "selected_option_id" UUID,
    "answer_text" TEXT,
    "auto_score" DECIMAL(65,30),
    "ai_score" DECIMAL(65,30),
    "final_score" DECIMAL(65,30),
    "is_correct" BOOLEAN,
    "feedback" TEXT,
    "answered_at" TIMESTAMPTZ(6),

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_grading_results" (
    "id" UUID NOT NULL,
    "attempt_answer_id" UUID,
    "rubric_id" UUID,
    "run_index" INTEGER,
    "ai_provider" TEXT,
    "model" TEXT,
    "prompt_version" TEXT,
    "total_score" DECIMAL(65,30),
    "confidence" DECIMAL(65,30),
    "is_uncertain" BOOLEAN,
    "reasoning" TEXT,
    "raw_response" JSONB,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_grading_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_grading_criterion_scores" (
    "id" UUID NOT NULL,
    "grading_result_id" UUID,
    "criterion_id" UUID,
    "score" INTEGER,
    "matched_descriptor_id" UUID,
    "evidence" TEXT,

    CONSTRAINT "ai_grading_criterion_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_consistency_checks" (
    "id" UUID NOT NULL,
    "attempt_answer_id" UUID,
    "rubric_id" UUID,
    "runs" INTEGER DEFAULT 0,
    "scores" JSONB,
    "std_dev" DECIMAL(65,30),
    "is_consistent" BOOLEAN,
    "triggered_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_consistency_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_runs" (
    "id" UUID NOT NULL,
    "purpose" TEXT,
    "requested_by" UUID,
    "attribute_id" UUID,
    "level_id" UUID,
    "provider" TEXT,
    "model" TEXT,
    "prompt_version" TEXT,
    "prompt_hash" TEXT,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER,
    "status" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_run_chunks" (
    "id" UUID NOT NULL,
    "run_id" UUID,
    "chunk_id" UUID,
    "similarity" DECIMAL(65,30),
    "rank" INTEGER DEFAULT 0,

    CONSTRAINT "ai_generation_run_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_requests" (
    "id" UUID NOT NULL,
    "goal_id" UUID,
    "goal_level_progress_id" UUID,
    "attribute_id" UUID,
    "mentee_id" UUID,
    "mentor_id" UUID,
    "round_number" INTEGER DEFAULT 0,
    "status" TEXT,
    "message" TEXT,
    "rejection_reason" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "mentor_request_id" UUID,
    "goal_id" UUID,
    "attribute_id" UUID,
    "mentee_id" UUID,
    "mentor_id" UUID,
    "round_number" INTEGER DEFAULT 0,
    "status" TEXT,
    "scheduled_start" TIMESTAMPTZ(6),
    "scheduled_end" TIMESTAMPTZ(6),
    "location" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_slots" (
    "id" UUID NOT NULL,
    "interview_id" UUID,
    "proposed_by" UUID,
    "proposer_role" TEXT,
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "status" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_evaluations" (
    "id" UUID NOT NULL,
    "interview_id" UUID,
    "evaluator_id" UUID,
    "rubric_id" UUID,
    "decision" TEXT,
    "total_score" DECIMAL(65,30),
    "notes" TEXT,
    "improvement_notes" TEXT,
    "cooldown_until" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),

    CONSTRAINT "interview_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_evaluation_scores" (
    "id" UUID NOT NULL,
    "evaluation_id" UUID,
    "criterion_id" UUID,
    "score" INTEGER,
    "note" TEXT,

    CONSTRAINT "interview_evaluation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_of_interests" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "related_user_id" UUID,
    "reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "conflict_of_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_attributes" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "attribute_id" UUID,
    "origin" TEXT,
    "goal_id" UUID,
    "interview_evaluation_id" UUID,
    "approved_by_mentor_id" UUID,
    "appointed_by_admin_id" UUID,
    "appointment_reason" TEXT,
    "achieved_at" TIMESTAMPTZ(6),
    "valid_from" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "status" TEXT,
    "is_accepting_mentees" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "member_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_refresh_requests" (
    "id" UUID NOT NULL,
    "member_attribute_id" UUID,
    "user_id" UUID,
    "status" TEXT,
    "project_name" TEXT,
    "project_description" TEXT,
    "role_in_project" TEXT,
    "project_period" TEXT,
    "previous_expires_at" TIMESTAMPTZ(6),
    "new_expires_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "attribute_refresh_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_refresh_evidences" (
    "id" UUID NOT NULL,
    "refresh_request_id" UUID,
    "evidence_type" TEXT,
    "url" TEXT,
    "file_key" TEXT,
    "file_name" TEXT,
    "file_mime" TEXT,
    "file_size" INTEGER,

    CONSTRAINT "attribute_refresh_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "member_attribute_id" UUID,
    "user_id" UUID,
    "attribute_id" UUID,
    "certificate_number" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(6),
    "valid_until" TIMESTAMPTZ(6),
    "file_key" TEXT,
    "status" TEXT,
    "revoked_reason" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" TEXT,
    "title" TEXT,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_interventions" (
    "id" UUID NOT NULL,
    "type" TEXT,
    "admin_id" UUID,
    "target_type" TEXT,
    "target_id" UUID,
    "reason" TEXT,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT,
    "entity_type" TEXT,
    "entity_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "requested_by" UUID,
    "export_type" TEXT,
    "filters" JSONB,
    "status" TEXT,
    "file_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_categories_slug_key" ON "attribute_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_code_key" ON "attributes"("code");

-- CreateIndex
CREATE INDEX "attributes_category_id_idx" ON "attributes"("category_id");

-- CreateIndex
CREATE INDEX "attribute_levels_attribute_id_idx" ON "attribute_levels"("attribute_id");

-- CreateIndex
CREATE INDEX "level_indicators_level_id_idx" ON "level_indicators"("level_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_attribute_id_idx" ON "knowledge_sources"("attribute_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_level_id_idx" ON "knowledge_sources"("level_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_source_id_idx" ON "knowledge_chunks"("source_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_attribute_id_idx" ON "knowledge_chunks"("attribute_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_level_id_idx" ON "knowledge_chunks"("level_id");

-- CreateIndex
CREATE INDEX "course_materials_level_id_idx" ON "course_materials"("level_id");

-- CreateIndex
CREATE INDEX "course_materials_generation_run_id_idx" ON "course_materials"("generation_run_id");

-- CreateIndex
CREATE INDEX "course_material_sources_material_id_idx" ON "course_material_sources"("material_id");

-- CreateIndex
CREATE INDEX "course_material_sources_source_id_idx" ON "course_material_sources"("source_id");

-- CreateIndex
CREATE INDEX "course_material_sources_chunk_id_idx" ON "course_material_sources"("chunk_id");

-- CreateIndex
CREATE INDEX "material_progress_user_id_idx" ON "material_progress"("user_id");

-- CreateIndex
CREATE INDEX "material_progress_goal_id_idx" ON "material_progress"("goal_id");

-- CreateIndex
CREATE INDEX "material_progress_material_id_idx" ON "material_progress"("material_id");

-- CreateIndex
CREATE INDEX "material_reports_reporter_id_idx" ON "material_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "material_reports_material_id_idx" ON "material_reports"("material_id");

-- CreateIndex
CREATE INDEX "material_reports_source_id_idx" ON "material_reports"("source_id");

-- CreateIndex
CREATE INDEX "rubrics_attribute_id_idx" ON "rubrics"("attribute_id");

-- CreateIndex
CREATE INDEX "rubrics_level_id_idx" ON "rubrics"("level_id");

-- CreateIndex
CREATE INDEX "rubrics_generation_run_id_idx" ON "rubrics"("generation_run_id");

-- CreateIndex
CREATE INDEX "rubric_criteria_rubric_id_idx" ON "rubric_criteria"("rubric_id");

-- CreateIndex
CREATE INDEX "rubric_descriptors_criterion_id_idx" ON "rubric_descriptors"("criterion_id");

-- CreateIndex
CREATE INDEX "questions_attribute_id_idx" ON "questions"("attribute_id");

-- CreateIndex
CREATE INDEX "questions_level_id_idx" ON "questions"("level_id");

-- CreateIndex
CREATE INDEX "questions_rubric_id_idx" ON "questions"("rubric_id");

-- CreateIndex
CREATE INDEX "questions_generation_run_id_idx" ON "questions"("generation_run_id");

-- CreateIndex
CREATE INDEX "question_options_question_id_idx" ON "question_options"("question_id");

-- CreateIndex
CREATE INDEX "question_chunks_question_id_idx" ON "question_chunks"("question_id");

-- CreateIndex
CREATE INDEX "question_chunks_chunk_id_idx" ON "question_chunks"("chunk_id");

-- CreateIndex
CREATE INDEX "pretest_sessions_user_id_idx" ON "pretest_sessions"("user_id");

-- CreateIndex
CREATE INDEX "pretest_answers_session_id_idx" ON "pretest_answers"("session_id");

-- CreateIndex
CREATE INDEX "pretest_answers_question_id_idx" ON "pretest_answers"("question_id");

-- CreateIndex
CREATE INDEX "pretest_answers_option_id_idx" ON "pretest_answers"("option_id");

-- CreateIndex
CREATE INDEX "pretest_results_session_id_idx" ON "pretest_results"("session_id");

-- CreateIndex
CREATE INDEX "pretest_results_attribute_id_idx" ON "pretest_results"("attribute_id");

-- CreateIndex
CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- CreateIndex
CREATE INDEX "goals_attribute_id_idx" ON "goals"("attribute_id");

-- CreateIndex
CREATE INDEX "goal_level_progress_goal_id_idx" ON "goal_level_progress"("goal_id");

-- CreateIndex
CREATE INDEX "goal_level_progress_level_id_idx" ON "goal_level_progress"("level_id");

-- CreateIndex
CREATE INDEX "level_attempts_goal_level_progress_id_idx" ON "level_attempts"("goal_level_progress_id");

-- CreateIndex
CREATE INDEX "level_attempts_user_id_idx" ON "level_attempts"("user_id");

-- CreateIndex
CREATE INDEX "level_attempts_level_id_idx" ON "level_attempts"("level_id");

-- CreateIndex
CREATE INDEX "level_attempts_rubric_id_idx" ON "level_attempts"("rubric_id");

-- CreateIndex
CREATE INDEX "level_attempts_generation_run_id_idx" ON "level_attempts"("generation_run_id");

-- CreateIndex
CREATE INDEX "attempt_answers_attempt_id_idx" ON "attempt_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "attempt_answers_question_id_idx" ON "attempt_answers"("question_id");

-- CreateIndex
CREATE INDEX "attempt_answers_selected_option_id_idx" ON "attempt_answers"("selected_option_id");

-- CreateIndex
CREATE INDEX "ai_grading_results_attempt_answer_id_idx" ON "ai_grading_results"("attempt_answer_id");

-- CreateIndex
CREATE INDEX "ai_grading_results_rubric_id_idx" ON "ai_grading_results"("rubric_id");

-- CreateIndex
CREATE INDEX "ai_grading_criterion_scores_grading_result_id_idx" ON "ai_grading_criterion_scores"("grading_result_id");

-- CreateIndex
CREATE INDEX "ai_grading_criterion_scores_criterion_id_idx" ON "ai_grading_criterion_scores"("criterion_id");

-- CreateIndex
CREATE INDEX "ai_grading_criterion_scores_matched_descriptor_id_idx" ON "ai_grading_criterion_scores"("matched_descriptor_id");

-- CreateIndex
CREATE INDEX "ai_consistency_checks_attempt_answer_id_idx" ON "ai_consistency_checks"("attempt_answer_id");

-- CreateIndex
CREATE INDEX "ai_consistency_checks_rubric_id_idx" ON "ai_consistency_checks"("rubric_id");

-- CreateIndex
CREATE INDEX "ai_generation_runs_attribute_id_idx" ON "ai_generation_runs"("attribute_id");

-- CreateIndex
CREATE INDEX "ai_generation_runs_level_id_idx" ON "ai_generation_runs"("level_id");

-- CreateIndex
CREATE INDEX "ai_generation_run_chunks_run_id_idx" ON "ai_generation_run_chunks"("run_id");

-- CreateIndex
CREATE INDEX "ai_generation_run_chunks_chunk_id_idx" ON "ai_generation_run_chunks"("chunk_id");

-- CreateIndex
CREATE INDEX "mentor_requests_goal_id_idx" ON "mentor_requests"("goal_id");

-- CreateIndex
CREATE INDEX "mentor_requests_goal_level_progress_id_idx" ON "mentor_requests"("goal_level_progress_id");

-- CreateIndex
CREATE INDEX "mentor_requests_attribute_id_idx" ON "mentor_requests"("attribute_id");

-- CreateIndex
CREATE INDEX "mentor_requests_mentee_id_idx" ON "mentor_requests"("mentee_id");

-- CreateIndex
CREATE INDEX "mentor_requests_mentor_id_idx" ON "mentor_requests"("mentor_id");

-- CreateIndex
CREATE INDEX "interviews_mentor_request_id_idx" ON "interviews"("mentor_request_id");

-- CreateIndex
CREATE INDEX "interviews_goal_id_idx" ON "interviews"("goal_id");

-- CreateIndex
CREATE INDEX "interviews_attribute_id_idx" ON "interviews"("attribute_id");

-- CreateIndex
CREATE INDEX "interviews_mentee_id_idx" ON "interviews"("mentee_id");

-- CreateIndex
CREATE INDEX "interviews_mentor_id_idx" ON "interviews"("mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_slots_interview_id_key" ON "interview_slots"("interview_id");

-- CreateIndex
CREATE INDEX "interview_slots_interview_id_idx" ON "interview_slots"("interview_id");

-- CreateIndex
CREATE INDEX "interview_slots_proposed_by_idx" ON "interview_slots"("proposed_by");

-- CreateIndex
CREATE UNIQUE INDEX "interview_evaluations_interview_id_key" ON "interview_evaluations"("interview_id");

-- CreateIndex
CREATE INDEX "interview_evaluations_interview_id_idx" ON "interview_evaluations"("interview_id");

-- CreateIndex
CREATE INDEX "interview_evaluations_evaluator_id_idx" ON "interview_evaluations"("evaluator_id");

-- CreateIndex
CREATE INDEX "interview_evaluations_rubric_id_idx" ON "interview_evaluations"("rubric_id");

-- CreateIndex
CREATE INDEX "interview_evaluation_scores_evaluation_id_idx" ON "interview_evaluation_scores"("evaluation_id");

-- CreateIndex
CREATE INDEX "interview_evaluation_scores_criterion_id_idx" ON "interview_evaluation_scores"("criterion_id");

-- CreateIndex
CREATE INDEX "conflict_of_interests_user_id_idx" ON "conflict_of_interests"("user_id");

-- CreateIndex
CREATE INDEX "conflict_of_interests_related_user_id_idx" ON "conflict_of_interests"("related_user_id");

-- CreateIndex
CREATE INDEX "member_attributes_user_id_idx" ON "member_attributes"("user_id");

-- CreateIndex
CREATE INDEX "member_attributes_attribute_id_idx" ON "member_attributes"("attribute_id");

-- CreateIndex
CREATE INDEX "member_attributes_goal_id_idx" ON "member_attributes"("goal_id");

-- CreateIndex
CREATE INDEX "member_attributes_interview_evaluation_id_idx" ON "member_attributes"("interview_evaluation_id");

-- CreateIndex
CREATE INDEX "member_attributes_approved_by_mentor_id_idx" ON "member_attributes"("approved_by_mentor_id");

-- CreateIndex
CREATE INDEX "member_attributes_appointed_by_admin_id_idx" ON "member_attributes"("appointed_by_admin_id");

-- CreateIndex
CREATE INDEX "attribute_refresh_requests_member_attribute_id_idx" ON "attribute_refresh_requests"("member_attribute_id");

-- CreateIndex
CREATE INDEX "attribute_refresh_requests_user_id_idx" ON "attribute_refresh_requests"("user_id");

-- CreateIndex
CREATE INDEX "attribute_refresh_evidences_refresh_request_id_idx" ON "attribute_refresh_evidences"("refresh_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");

-- CreateIndex
CREATE INDEX "certificates_member_attribute_id_idx" ON "certificates"("member_attribute_id");

-- CreateIndex
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");

-- CreateIndex
CREATE INDEX "certificates_attribute_id_idx" ON "certificates"("attribute_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "admin_interventions_admin_id_idx" ON "admin_interventions"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "export_jobs_requested_by_idx" ON "export_jobs"("requested_by");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "attribute_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_levels" ADD CONSTRAINT "attribute_levels_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_indicators" ADD CONSTRAINT "level_indicators_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "ai_generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_material_sources" ADD CONSTRAINT "course_material_sources_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "course_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_material_sources" ADD CONSTRAINT "course_material_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_material_sources" ADD CONSTRAINT "course_material_sources_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_progress" ADD CONSTRAINT "material_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_progress" ADD CONSTRAINT "material_progress_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_progress" ADD CONSTRAINT "material_progress_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "course_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reports" ADD CONSTRAINT "material_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reports" ADD CONSTRAINT "material_reports_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "course_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reports" ADD CONSTRAINT "material_reports_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "ai_generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_descriptors" ADD CONSTRAINT "rubric_descriptors_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "ai_generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_chunks" ADD CONSTRAINT "question_chunks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_chunks" ADD CONSTRAINT "question_chunks_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_sessions" ADD CONSTRAINT "pretest_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_answers" ADD CONSTRAINT "pretest_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pretest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_answers" ADD CONSTRAINT "pretest_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_answers" ADD CONSTRAINT "pretest_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_results" ADD CONSTRAINT "pretest_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pretest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_results" ADD CONSTRAINT "pretest_results_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_level_progress" ADD CONSTRAINT "goal_level_progress_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_level_progress" ADD CONSTRAINT "goal_level_progress_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_goal_level_progress_id_fkey" FOREIGN KEY ("goal_level_progress_id") REFERENCES "goal_level_progress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "ai_generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "level_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_grading_results" ADD CONSTRAINT "ai_grading_results_attempt_answer_id_fkey" FOREIGN KEY ("attempt_answer_id") REFERENCES "attempt_answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_grading_results" ADD CONSTRAINT "ai_grading_results_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_grading_criterion_scores" ADD CONSTRAINT "ai_grading_criterion_scores_grading_result_id_fkey" FOREIGN KEY ("grading_result_id") REFERENCES "ai_grading_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_grading_criterion_scores" ADD CONSTRAINT "ai_grading_criterion_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_grading_criterion_scores" ADD CONSTRAINT "ai_grading_criterion_scores_matched_descriptor_id_fkey" FOREIGN KEY ("matched_descriptor_id") REFERENCES "rubric_descriptors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_consistency_checks" ADD CONSTRAINT "ai_consistency_checks_attempt_answer_id_fkey" FOREIGN KEY ("attempt_answer_id") REFERENCES "attempt_answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_consistency_checks" ADD CONSTRAINT "ai_consistency_checks_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_runs" ADD CONSTRAINT "ai_generation_runs_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_runs" ADD CONSTRAINT "ai_generation_runs_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "attribute_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_run_chunks" ADD CONSTRAINT "ai_generation_run_chunks_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "ai_generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_run_chunks" ADD CONSTRAINT "ai_generation_run_chunks_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_goal_level_progress_id_fkey" FOREIGN KEY ("goal_level_progress_id") REFERENCES "goal_level_progress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_mentor_request_id_fkey" FOREIGN KEY ("mentor_request_id") REFERENCES "mentor_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_slots" ADD CONSTRAINT "interview_slots_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_slots" ADD CONSTRAINT "interview_slots_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_evaluation_scores" ADD CONSTRAINT "interview_evaluation_scores_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "interview_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_evaluation_scores" ADD CONSTRAINT "interview_evaluation_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_of_interests" ADD CONSTRAINT "conflict_of_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_of_interests" ADD CONSTRAINT "conflict_of_interests_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_attributes" ADD CONSTRAINT "member_attributes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_attributes" ADD CONSTRAINT "member_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_attributes" ADD CONSTRAINT "member_attributes_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_attributes" ADD CONSTRAINT "member_attributes_interview_evaluation_id_fkey" FOREIGN KEY ("interview_evaluation_id") REFERENCES "interview_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_attributes" ADD CONSTRAINT "member_attributes_approved_by_mentor_id_fkey" FOREIGN KEY ("approved_by_mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_attributes" ADD CONSTRAINT "member_attributes_appointed_by_admin_id_fkey" FOREIGN KEY ("appointed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_refresh_requests" ADD CONSTRAINT "attribute_refresh_requests_member_attribute_id_fkey" FOREIGN KEY ("member_attribute_id") REFERENCES "member_attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_refresh_requests" ADD CONSTRAINT "attribute_refresh_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_refresh_evidences" ADD CONSTRAINT "attribute_refresh_evidences_refresh_request_id_fkey" FOREIGN KEY ("refresh_request_id") REFERENCES "attribute_refresh_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_member_attribute_id_fkey" FOREIGN KEY ("member_attribute_id") REFERENCES "member_attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_interventions" ADD CONSTRAINT "admin_interventions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
