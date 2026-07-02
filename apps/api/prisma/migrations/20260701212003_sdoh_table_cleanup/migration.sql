/*
  Warnings:

  - You are about to drop the `sdoh_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sdoh_datasets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sdoh_exports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sdoh_feature_flags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sdoh_publication_outputs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ResearchDatasetLifecycleStatus" AS ENUM ('UPLOADED', 'PROFILED', 'VALIDATED', 'APPROVED', 'COHORT_READY', 'ANALYSIS_READY', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResearchApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ResearchArtifactFormat" AS ENUM ('JSON', 'CSV', 'XLSX', 'PDF', 'DOCX', 'PPTX', 'PNG', 'SVG', 'HTML');

-- DropForeignKey
ALTER TABLE "data_preparation_stage_runs" DROP CONSTRAINT "data_preparation_stage_runs_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "dataset_registry_records" DROP CONSTRAINT "dataset_registry_records_registered_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "dataset_registry_records" DROP CONSTRAINT "dataset_registry_records_source_workspace_file_id_fkey";

-- DropForeignKey
ALTER TABLE "dataset_registry_records" DROP CONSTRAINT "dataset_registry_records_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_archives" DROP CONSTRAINT "workspace_archives_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_archives" DROP CONSTRAINT "workspace_archives_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_files" DROP CONSTRAINT "workspace_files_archive_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_files" DROP CONSTRAINT "workspace_files_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_files" DROP CONSTRAINT "workspace_files_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_files" DROP CONSTRAINT "workspace_files_workspace_id_fkey";

-- AlterTable
ALTER TABLE "data_preparation_workflows" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "database_connections" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "dataset_registry_records" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_archives" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspace_files" ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "sdoh_audit_logs";

-- DropTable
DROP TABLE "sdoh_datasets";

-- DropTable
DROP TABLE "sdoh_exports";

-- DropTable
DROP TABLE "sdoh_feature_flags";

-- DropTable
DROP TABLE "sdoh_publication_outputs";

-- CreateTable
CREATE TABLE "dataset_status" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "status" "ResearchDatasetLifecycleStatus" NOT NULL,
    "reason" TEXT,
    "metadata_json" JSONB,
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_versions" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "version" INTEGER NOT NULL,
    "label" VARCHAR(140) NOT NULL,
    "storage_path" VARCHAR(255),
    "schema_json" JSONB,
    "change_log" TEXT,
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_lineage" (
    "id" VARCHAR(30) NOT NULL,
    "source_dataset_id" VARCHAR(30),
    "target_dataset_id" VARCHAR(30) NOT NULL,
    "operation" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "transformation_json" JSONB,
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_lineage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_approvals" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "status" "ResearchApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "stage" VARCHAR(120) NOT NULL,
    "decision_by_id" VARCHAR(30),
    "notes" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dataset_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "analysis_job_id" VARCHAR(30),
    "analysis_type" VARCHAR(120) NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "parameters_json" JSONB,
    "result_json" JSONB,
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_interpretations" (
    "id" VARCHAR(30) NOT NULL,
    "analysis_result_id" VARCHAR(30) NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence_json" JSONB,
    "generated_by" VARCHAR(80) NOT NULL DEFAULT 'system',
    "reviewed_by_id" VARCHAR(30),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_interpretations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visualization_outputs" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "analysis_result_id" VARCHAR(30),
    "chart_type" VARCHAR(120) NOT NULL,
    "format" "ResearchArtifactFormat" NOT NULL DEFAULT 'JSON',
    "payload_json" JSONB,
    "storage_path" VARCHAR(255),
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visualization_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_outputs" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "analysis_result_id" VARCHAR(30),
    "output_type" VARCHAR(120) NOT NULL,
    "format" "ResearchArtifactFormat" NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "payload_json" JSONB,
    "storage_path" VARCHAR(255),
    "approval_status" "ResearchApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_metadata_tables" (
    "id" VARCHAR(30) NOT NULL,
    "connection_id" VARCHAR(30),
    "schema_name" VARCHAR(140) NOT NULL,
    "table_name" VARCHAR(140) NOT NULL,
    "table_type" VARCHAR(40) NOT NULL,
    "column_count" INTEGER NOT NULL DEFAULT 0,
    "estimated_rows" INTEGER NOT NULL DEFAULT 0,
    "total_bytes" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "database_metadata_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_metadata_columns" (
    "id" VARCHAR(30) NOT NULL,
    "connection_id" VARCHAR(30),
    "schema_name" VARCHAR(140) NOT NULL,
    "table_name" VARCHAR(140) NOT NULL,
    "column_name" VARCHAR(140) NOT NULL,
    "data_type" VARCHAR(120) NOT NULL,
    "is_nullable" BOOLEAN NOT NULL DEFAULT true,
    "ordinal_position" INTEGER NOT NULL,
    "column_default" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "database_metadata_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_queries" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "sql_text" TEXT NOT NULL,
    "connection_id" VARCHAR(30),
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_history" (
    "id" VARCHAR(30) NOT NULL,
    "connection_id" VARCHAR(30),
    "sql_text" TEXT NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "execution_ms" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_results" (
    "id" VARCHAR(30) NOT NULL,
    "query_history_id" VARCHAR(30),
    "columns_json" JSONB NOT NULL,
    "rows_json" JSONB NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_builds" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "source_type" VARCHAR(40) NOT NULL,
    "source_ref" TEXT NOT NULL,
    "variables_json" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(60) NOT NULL DEFAULT 'ANALYSIS_READY',
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dataset_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_audit_logs" (
    "id" VARCHAR(30) NOT NULL,
    "actor_id" VARCHAR(30),
    "actor_label" VARCHAR(180),
    "action" VARCHAR(120) NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "database_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dataset_status_dataset_id_idx" ON "dataset_status"("dataset_id");

-- CreateIndex
CREATE INDEX "dataset_status_status_idx" ON "dataset_status"("status");

-- CreateIndex
CREATE INDEX "dataset_status_created_at_idx" ON "dataset_status"("created_at");

-- CreateIndex
CREATE INDEX "dataset_versions_dataset_id_idx" ON "dataset_versions"("dataset_id");

-- CreateIndex
CREATE INDEX "dataset_versions_created_at_idx" ON "dataset_versions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "dataset_versions_dataset_id_version_key" ON "dataset_versions"("dataset_id", "version");

-- CreateIndex
CREATE INDEX "dataset_lineage_source_dataset_id_idx" ON "dataset_lineage"("source_dataset_id");

-- CreateIndex
CREATE INDEX "dataset_lineage_target_dataset_id_idx" ON "dataset_lineage"("target_dataset_id");

-- CreateIndex
CREATE INDEX "dataset_lineage_operation_idx" ON "dataset_lineage"("operation");

-- CreateIndex
CREATE INDEX "dataset_lineage_created_at_idx" ON "dataset_lineage"("created_at");

-- CreateIndex
CREATE INDEX "dataset_approvals_dataset_id_idx" ON "dataset_approvals"("dataset_id");

-- CreateIndex
CREATE INDEX "dataset_approvals_status_idx" ON "dataset_approvals"("status");

-- CreateIndex
CREATE INDEX "dataset_approvals_stage_idx" ON "dataset_approvals"("stage");

-- CreateIndex
CREATE INDEX "analysis_results_dataset_id_idx" ON "analysis_results"("dataset_id");

-- CreateIndex
CREATE INDEX "analysis_results_analysis_job_id_idx" ON "analysis_results"("analysis_job_id");

-- CreateIndex
CREATE INDEX "analysis_results_analysis_type_idx" ON "analysis_results"("analysis_type");

-- CreateIndex
CREATE INDEX "analysis_results_created_at_idx" ON "analysis_results"("created_at");

-- CreateIndex
CREATE INDEX "analysis_interpretations_analysis_result_id_idx" ON "analysis_interpretations"("analysis_result_id");

-- CreateIndex
CREATE INDEX "analysis_interpretations_created_at_idx" ON "analysis_interpretations"("created_at");

-- CreateIndex
CREATE INDEX "visualization_outputs_dataset_id_idx" ON "visualization_outputs"("dataset_id");

-- CreateIndex
CREATE INDEX "visualization_outputs_analysis_result_id_idx" ON "visualization_outputs"("analysis_result_id");

-- CreateIndex
CREATE INDEX "visualization_outputs_chart_type_idx" ON "visualization_outputs"("chart_type");

-- CreateIndex
CREATE INDEX "publication_outputs_dataset_id_idx" ON "publication_outputs"("dataset_id");

-- CreateIndex
CREATE INDEX "publication_outputs_analysis_result_id_idx" ON "publication_outputs"("analysis_result_id");

-- CreateIndex
CREATE INDEX "publication_outputs_output_type_idx" ON "publication_outputs"("output_type");

-- CreateIndex
CREATE INDEX "publication_outputs_approval_status_idx" ON "publication_outputs"("approval_status");

-- CreateIndex
CREATE INDEX "database_metadata_tables_schema_name_idx" ON "database_metadata_tables"("schema_name");

-- CreateIndex
CREATE INDEX "database_metadata_tables_table_type_idx" ON "database_metadata_tables"("table_type");

-- CreateIndex
CREATE UNIQUE INDEX "database_metadata_tables_connection_id_schema_name_table_na_key" ON "database_metadata_tables"("connection_id", "schema_name", "table_name");

-- CreateIndex
CREATE INDEX "database_metadata_columns_schema_name_table_name_idx" ON "database_metadata_columns"("schema_name", "table_name");

-- CreateIndex
CREATE INDEX "database_metadata_columns_data_type_idx" ON "database_metadata_columns"("data_type");

-- CreateIndex
CREATE UNIQUE INDEX "database_metadata_columns_connection_id_schema_name_table_n_key" ON "database_metadata_columns"("connection_id", "schema_name", "table_name", "column_name");

-- CreateIndex
CREATE INDEX "saved_queries_connection_id_idx" ON "saved_queries"("connection_id");

-- CreateIndex
CREATE INDEX "saved_queries_created_by_id_idx" ON "saved_queries"("created_by_id");

-- CreateIndex
CREATE INDEX "query_history_connection_id_idx" ON "query_history"("connection_id");

-- CreateIndex
CREATE INDEX "query_history_status_idx" ON "query_history"("status");

-- CreateIndex
CREATE INDEX "query_history_created_at_idx" ON "query_history"("created_at");

-- CreateIndex
CREATE INDEX "query_results_query_history_id_idx" ON "query_results"("query_history_id");

-- CreateIndex
CREATE INDEX "query_results_created_at_idx" ON "query_results"("created_at");

-- CreateIndex
CREATE INDEX "dataset_builds_source_type_idx" ON "dataset_builds"("source_type");

-- CreateIndex
CREATE INDEX "dataset_builds_status_idx" ON "dataset_builds"("status");

-- CreateIndex
CREATE INDEX "dataset_builds_created_at_idx" ON "dataset_builds"("created_at");

-- CreateIndex
CREATE INDEX "database_audit_logs_actor_id_idx" ON "database_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "database_audit_logs_action_idx" ON "database_audit_logs"("action");

-- CreateIndex
CREATE INDEX "database_audit_logs_created_at_idx" ON "database_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "data_preparation_stage_runs" ADD CONSTRAINT "data_preparation_stage_runs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "data_preparation_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_archives" ADD CONSTRAINT "workspace_archives_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_archives" ADD CONSTRAINT "workspace_archives_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_files" ADD CONSTRAINT "workspace_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_files" ADD CONSTRAINT "workspace_files_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "workspace_archives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_files" ADD CONSTRAINT "workspace_files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "workspace_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_files" ADD CONSTRAINT "workspace_files_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_registry_records" ADD CONSTRAINT "dataset_registry_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_registry_records" ADD CONSTRAINT "dataset_registry_records_source_workspace_file_id_fkey" FOREIGN KEY ("source_workspace_file_id") REFERENCES "workspace_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_registry_records" ADD CONSTRAINT "dataset_registry_records_registered_dataset_id_fkey" FOREIGN KEY ("registered_dataset_id") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
