-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProcessedStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'RESEARCHER', 'VIEWER');

-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DatasetVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "AnalysisJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REQUEST_CREATED', 'REQUEST_REVIEWED', 'REQUEST_COMMENT', 'DATASET_ADDED', 'REPORT_CREATED', 'MEMBER_ADDED', 'APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_NEEDS_MORE_INFO');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED_2FA_PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ResearcherType" AS ENUM ('GENERAL_RESEARCHER', 'STUDENT_RESEARCHER', 'CLINICAL_RESEARCHER', 'EXTERNAL_COLLABORATOR');

-- CreateEnum
CREATE TYPE "ApplicationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING');

-- CreateEnum
CREATE TYPE "PipelineRunStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'PARTIAL_SUCCESS');

-- CreateEnum
CREATE TYPE "PipelineStepStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PipelineStepType" AS ENUM ('INGEST', 'PROFILE', 'VALIDATE', 'CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT', 'TRAIN', 'EVALUATE', 'EXPLAIN', 'CHART', 'REPORT', 'EXPORT', 'PUBLISH');

-- CreateEnum
CREATE TYPE "WorkerJobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELED');

-- CreateEnum
CREATE TYPE "ArtifactKind" AS ENUM ('DATASET', 'CLEANED_DATASET', 'FEATURE_SET', 'MODEL', 'METRICS', 'CHART', 'REPORT', 'EXPORT_PACKAGE', 'LOG');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(30) NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "institution" VARCHAR(191),
    "department" VARCHAR(191),
    "research_group" VARCHAR(191),
    "timezone" VARCHAR(100),
    "country_code" VARCHAR(10) NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "referral_code" VARCHAR(50),
    "password_hash" VARCHAR(255) NOT NULL,
    "password_changed_at" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notification_preferences" JSONB,
    "date_of_birth" DATE NOT NULL,
    "reset_token" VARCHAR(255),
    "reset_token_expires" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "account_status" "AccountStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" VARCHAR(30) NOT NULL,
    "role_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" VARCHAR(30) NOT NULL,
    "permission_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdomains" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "domain_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "subdomains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "subdomain_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "category_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_outcomes" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "health_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demographics" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geography_units" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "geography_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_units" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_portals" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_portals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_formats" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_locations" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_batches" (
    "id" VARCHAR(30) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "created_by_id" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" VARCHAR(30) NOT NULL,
    "upload_batch_id" VARCHAR(30) NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_by_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_errors" (
    "id" VARCHAR(30) NOT NULL,
    "import_job_id" VARCHAR(30) NOT NULL,
    "row_number" INTEGER,
    "field_name" VARCHAR(191),
    "message" TEXT NOT NULL,

    CONSTRAINT "validation_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_data" (
    "id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "data_year" INTEGER NOT NULL,
    "value" DECIMAL(18,4),
    "notes" TEXT,
    "processed_status" "ProcessedStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "domain_id" VARCHAR(30) NOT NULL,
    "subdomain_id" VARCHAR(30) NOT NULL,
    "category_id" VARCHAR(30) NOT NULL,
    "subcategory_id" VARCHAR(30),
    "health_outcome_id" VARCHAR(30) NOT NULL,
    "variable_id" VARCHAR(30) NOT NULL,
    "demographic_id" VARCHAR(30) NOT NULL,
    "geography_unit_id" VARCHAR(30) NOT NULL,
    "data_unit_id" VARCHAR(30) NOT NULL,
    "data_source_id" VARCHAR(30) NOT NULL,
    "data_portal_id" VARCHAR(30),
    "data_format_id" VARCHAR(30),
    "data_location_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30),
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(30),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "visibility" "DatasetVisibility" NOT NULL DEFAULT 'WORKSPACE',
    "storagePath" VARCHAR(255),
    "mimeType" VARCHAR(100),
    "sizeBytes" INTEGER,
    "recordCount" INTEGER,
    "tags" TEXT[],
    "workspaceId" VARCHAR(30) NOT NULL,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "status" "AnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
    "jobType" VARCHAR(80) NOT NULL,
    "parametersJson" JSONB,
    "resultsJson" JSONB,
    "logsText" TEXT,
    "workspaceId" VARCHAR(30) NOT NULL,
    "datasetId" VARCHAR(30),
    "createdById" VARCHAR(30) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "reportType" VARCHAR(80) NOT NULL,
    "storagePath" VARCHAR(255),
    "publicUrl" VARCHAR(255),
    "metadataJson" JSONB,
    "workspaceId" VARCHAR(30) NOT NULL,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30),
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "link" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" VARCHAR(30) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" VARCHAR(255) NOT NULL,
    "public_url" VARCHAR(255),
    "uploaded_by_id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30),
    "report_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineTemplate" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definitionJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "datasetId" VARCHAR(30),
    "requestId" VARCHAR(30),
    "triggeredById" VARCHAR(30) NOT NULL,
    "templateId" VARCHAR(30),
    "name" VARCHAR(191) NOT NULL,
    "status" "PipelineRunStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "parametersJson" JSONB,
    "contextJson" JSONB,
    "metricsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStep" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "order" INTEGER NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "type" "PipelineStepType" NOT NULL,
    "status" "PipelineStepStatus" NOT NULL DEFAULT 'PENDING',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workerType" VARCHAR(120),
    "dependsOnStepId" VARCHAR(30),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "configJson" JSONB,
    "metricsJson" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerJob" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "pipelineStepId" VARCHAR(30),
    "queueName" VARCHAR(120) NOT NULL,
    "jobName" VARCHAR(191) NOT NULL,
    "workerType" VARCHAR(120) NOT NULL,
    "status" "WorkerJobStatus" NOT NULL DEFAULT 'QUEUED',
    "brokerJobId" VARCHAR(120),
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payloadJson" JSONB NOT NULL,
    "resultJson" JSONB,
    "errorJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineArtifact" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "datasetId" VARCHAR(30),
    "reportId" VARCHAR(30),
    "kind" "ArtifactKind" NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "storageKey" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120),
    "sizeBytes" BIGINT,
    "checksum" VARCHAR(191),
    "metadataJson" JSONB,
    "createdById" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineEvent" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "stepOrder" INTEGER,
    "eventType" VARCHAR(120) NOT NULL,
    "level" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "dataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelRegistryEntry" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30),
    "datasetId" VARCHAR(30),
    "name" VARCHAR(191) NOT NULL,
    "version" VARCHAR(120) NOT NULL,
    "framework" VARCHAR(120),
    "taskType" VARCHAR(120),
    "storageKey" VARCHAR(255) NOT NULL,
    "metricsJson" JSONB,
    "paramsJson" JSONB,
    "schemaJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "promotedAt" TIMESTAMP(3),
    "createdById" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelRegistryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "researcher_applications" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "researcher_type" "ResearcherType" NOT NULL,
    "institution" VARCHAR(191) NOT NULL,
    "department" VARCHAR(191) NOT NULL,
    "role_title" VARCHAR(191) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "years_of_experience" INTEGER NOT NULL,
    "research_area" VARCHAR(191) NOT NULL,
    "short_bio" TEXT NOT NULL,
    "research_interests" TEXT NOT NULL,
    "platform_purpose" TEXT NOT NULL,
    "expected_datasets" TEXT NOT NULL,
    "collaboration_type" VARCHAR(100) NOT NULL,
    "feature_needs_json" JSONB NOT NULL,
    "uses_sensitive_data" BOOLEAN NOT NULL,
    "irb_required" BOOLEAN NOT NULL,
    "irb_protocol_number" VARCHAR(191),
    "data_sensitivity_level" VARCHAR(50) NOT NULL,
    "funding_source" VARCHAR(191),
    "supervisor_name" VARCHAR(191) NOT NULL,
    "supervisor_email" VARCHAR(191) NOT NULL,
    "cv_file_url" VARCHAR(512),
    "affiliation_proof_url" VARCHAR(512),
    "irb_document_url" VARCHAR(512),
    "review_status" "ApplicationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "admin_review_notes" TEXT,
    "reviewed_by_admin_id" VARCHAR(30),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "researcher_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ReportDatasets" (
    "A" VARCHAR(30) NOT NULL,
    "B" VARCHAR(30) NOT NULL,

    CONSTRAINT "_ReportDatasets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_country_code_mobile_number_key" ON "users"("country_code", "mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "domains_name_key" ON "domains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subdomains_name_key" ON "subdomains"("name");

-- CreateIndex
CREATE INDEX "subdomains_domain_id_idx" ON "subdomains"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_subdomain_id_idx" ON "categories"("subdomain_id");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_name_key" ON "subcategories"("name");

-- CreateIndex
CREATE INDEX "subcategories_category_id_idx" ON "subcategories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_outcomes_name_key" ON "health_outcomes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "variables_name_key" ON "variables"("name");

-- CreateIndex
CREATE UNIQUE INDEX "demographics_name_key" ON "demographics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "geography_units_name_key" ON "geography_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_units_name_key" ON "data_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_name_key" ON "data_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_portals_name_key" ON "data_portals"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_formats_name_key" ON "data_formats"("name");

-- CreateIndex
CREATE UNIQUE INDEX "data_locations_name_key" ON "data_locations"("name");

-- CreateIndex
CREATE INDEX "upload_batches_created_by_id_idx" ON "upload_batches"("created_by_id");

-- CreateIndex
CREATE INDEX "import_jobs_upload_batch_id_idx" ON "import_jobs"("upload_batch_id");

-- CreateIndex
CREATE INDEX "import_jobs_created_by_id_idx" ON "import_jobs"("created_by_id");

-- CreateIndex
CREATE INDEX "validation_errors_import_job_id_idx" ON "validation_errors"("import_job_id");

-- CreateIndex
CREATE INDEX "health_data_data_year_idx" ON "health_data"("data_year");

-- CreateIndex
CREATE INDEX "health_data_domain_id_idx" ON "health_data"("domain_id");

-- CreateIndex
CREATE INDEX "health_data_subdomain_id_idx" ON "health_data"("subdomain_id");

-- CreateIndex
CREATE INDEX "health_data_category_id_idx" ON "health_data"("category_id");

-- CreateIndex
CREATE INDEX "health_data_health_outcome_id_idx" ON "health_data"("health_outcome_id");

-- CreateIndex
CREATE INDEX "health_data_variable_id_idx" ON "health_data"("variable_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "Workspace_status_idx" ON "Workspace"("status");

-- CreateIndex
CREATE INDEX "Workspace_createdAt_idx" ON "Workspace"("createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_role_idx" ON "WorkspaceMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Dataset_workspaceId_idx" ON "Dataset"("workspaceId");

-- CreateIndex
CREATE INDEX "Dataset_createdById_idx" ON "Dataset"("createdById");

-- CreateIndex
CREATE INDEX "Dataset_visibility_idx" ON "Dataset"("visibility");

-- CreateIndex
CREATE INDEX "Dataset_createdAt_idx" ON "Dataset"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisJob_workspaceId_idx" ON "AnalysisJob"("workspaceId");

-- CreateIndex
CREATE INDEX "AnalysisJob_datasetId_idx" ON "AnalysisJob"("datasetId");

-- CreateIndex
CREATE INDEX "AnalysisJob_createdById_idx" ON "AnalysisJob"("createdById");

-- CreateIndex
CREATE INDEX "AnalysisJob_status_idx" ON "AnalysisJob"("status");

-- CreateIndex
CREATE INDEX "AnalysisJob_createdAt_idx" ON "AnalysisJob"("createdAt");

-- CreateIndex
CREATE INDEX "Report_workspaceId_idx" ON "Report"("workspaceId");

-- CreateIndex
CREATE INDEX "Report_createdById_idx" ON "Report"("createdById");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_workspace_id_idx" ON "notifications"("workspace_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "file_assets_dataset_id_idx" ON "file_assets"("dataset_id");

-- CreateIndex
CREATE INDEX "file_assets_report_id_idx" ON "file_assets"("report_id");

-- CreateIndex
CREATE INDEX "file_assets_uploaded_by_id_idx" ON "file_assets"("uploaded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineTemplate_code_key" ON "PipelineTemplate"("code");

-- CreateIndex
CREATE INDEX "PipelineRun_workspaceId_status_idx" ON "PipelineRun"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "PipelineRun_datasetId_idx" ON "PipelineRun"("datasetId");

-- CreateIndex
CREATE INDEX "PipelineRun_requestId_idx" ON "PipelineRun"("requestId");

-- CreateIndex
CREATE INDEX "PipelineRun_triggeredById_idx" ON "PipelineRun"("triggeredById");

-- CreateIndex
CREATE INDEX "PipelineStep_pipelineRunId_status_idx" ON "PipelineStep"("pipelineRunId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStep_pipelineRunId_order_key" ON "PipelineStep"("pipelineRunId", "order");

-- CreateIndex
CREATE INDEX "WorkerJob_pipelineRunId_status_idx" ON "WorkerJob"("pipelineRunId", "status");

-- CreateIndex
CREATE INDEX "WorkerJob_pipelineStepId_idx" ON "WorkerJob"("pipelineStepId");

-- CreateIndex
CREATE INDEX "WorkerJob_brokerJobId_idx" ON "WorkerJob"("brokerJobId");

-- CreateIndex
CREATE INDEX "PipelineArtifact_pipelineRunId_kind_idx" ON "PipelineArtifact"("pipelineRunId", "kind");

-- CreateIndex
CREATE INDEX "PipelineArtifact_workspaceId_kind_idx" ON "PipelineArtifact"("workspaceId", "kind");

-- CreateIndex
CREATE INDEX "PipelineEvent_pipelineRunId_createdAt_idx" ON "PipelineEvent"("pipelineRunId", "createdAt");

-- CreateIndex
CREATE INDEX "ModelRegistryEntry_workspaceId_name_idx" ON "ModelRegistryEntry"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "ModelRegistryEntry_datasetId_idx" ON "ModelRegistryEntry"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "researcher_applications_user_id_key" ON "researcher_applications"("user_id");

-- CreateIndex
CREATE INDEX "researcher_applications_review_status_created_at_idx" ON "researcher_applications"("review_status", "created_at");

-- CreateIndex
CREATE INDEX "researcher_applications_institution_idx" ON "researcher_applications"("institution");

-- CreateIndex
CREATE INDEX "_ReportDatasets_B_index" ON "_ReportDatasets"("B");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdomains" ADD CONSTRAINT "subdomains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "subdomains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_upload_batch_id_fkey" FOREIGN KEY ("upload_batch_id") REFERENCES "upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_errors" ADD CONSTRAINT "validation_errors_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "subdomains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_health_outcome_id_fkey" FOREIGN KEY ("health_outcome_id") REFERENCES "health_outcomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_demographic_id_fkey" FOREIGN KEY ("demographic_id") REFERENCES "demographics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_geography_unit_id_fkey" FOREIGN KEY ("geography_unit_id") REFERENCES "geography_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_data_unit_id_fkey" FOREIGN KEY ("data_unit_id") REFERENCES "data_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_data_portal_id_fkey" FOREIGN KEY ("data_portal_id") REFERENCES "data_portals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_data_format_id_fkey" FOREIGN KEY ("data_format_id") REFERENCES "data_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_data" ADD CONSTRAINT "health_data_data_location_id_fkey" FOREIGN KEY ("data_location_id") REFERENCES "data_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineRun" ADD CONSTRAINT "PipelineRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineRun" ADD CONSTRAINT "PipelineRun_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineRun" ADD CONSTRAINT "PipelineRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineRun" ADD CONSTRAINT "PipelineRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PipelineTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStep" ADD CONSTRAINT "PipelineStep_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerJob" ADD CONSTRAINT "WorkerJob_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerJob" ADD CONSTRAINT "WorkerJob_pipelineStepId_fkey" FOREIGN KEY ("pipelineStepId") REFERENCES "PipelineStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineEvent" ADD CONSTRAINT "PipelineEvent_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "researcher_applications" ADD CONSTRAINT "researcher_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReportDatasets" ADD CONSTRAINT "_ReportDatasets_A_fkey" FOREIGN KEY ("A") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReportDatasets" ADD CONSTRAINT "_ReportDatasets_B_fkey" FOREIGN KEY ("B") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

