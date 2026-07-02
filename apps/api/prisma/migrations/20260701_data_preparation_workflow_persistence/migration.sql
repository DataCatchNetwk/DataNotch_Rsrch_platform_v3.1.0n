CREATE TABLE IF NOT EXISTS "data_preparation_workflows" (
  "id" VARCHAR(30) PRIMARY KEY,
  "source_connection_id" VARCHAR(120) NOT NULL,
  "dataset_name" VARCHAR(180) NOT NULL,
  "query_id" VARCHAR(120),
  "sql_text" TEXT NOT NULL,
  "current_stage" VARCHAR(40) NOT NULL,
  "next_stage" VARCHAR(40) NOT NULL,
  "status" VARCHAR(60) NOT NULL,
  "last_message" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "data_preparation_stage_runs" (
  "id" VARCHAR(30) PRIMARY KEY,
  "workflow_id" VARCHAR(30) NOT NULL,
  "stage" VARCHAR(40) NOT NULL,
  "status" VARCHAR(60) NOT NULL,
  "metrics_json" JSONB,
  "worklist_json" JSONB,
  "changed_rows" INTEGER NOT NULL DEFAULT 0,
  "changed_columns" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'data_preparation_stage_runs_workflow_id_fkey'
  ) THEN
    ALTER TABLE "data_preparation_stage_runs"
      ADD CONSTRAINT "data_preparation_stage_runs_workflow_id_fkey"
      FOREIGN KEY ("workflow_id") REFERENCES "data_preparation_workflows"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "data_preparation_workflows_current_stage_idx"
  ON "data_preparation_workflows"("current_stage");
CREATE INDEX IF NOT EXISTS "data_preparation_workflows_status_idx"
  ON "data_preparation_workflows"("status");
CREATE INDEX IF NOT EXISTS "data_preparation_workflows_updated_at_idx"
  ON "data_preparation_workflows"("updated_at");

CREATE INDEX IF NOT EXISTS "data_preparation_stage_runs_workflow_id_idx"
  ON "data_preparation_stage_runs"("workflow_id");
CREATE INDEX IF NOT EXISTS "data_preparation_stage_runs_stage_idx"
  ON "data_preparation_stage_runs"("stage");
CREATE INDEX IF NOT EXISTS "data_preparation_stage_runs_created_at_idx"
  ON "data_preparation_stage_runs"("created_at");
