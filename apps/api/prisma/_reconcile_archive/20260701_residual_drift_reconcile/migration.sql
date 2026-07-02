-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED_2FA_PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."AnalysisAlgorithmType" AS ENUM ('DECISION_TREE', 'RANDOM_FOREST', 'GRADIENT_BOOSTING', 'XGBOOST', 'LIGHTGBM', 'CATBOOST', 'EXTRA_TREES', 'ADABOOST', 'BAGGING', 'ANN_MLP', 'CNN', 'RNN', 'LSTM', 'GRU', 'TRANSFORMER', 'AUTOENCODER', 'NAIVE_BAYES', 'BAYESIAN_NETWORK', 'GAUSSIAN_PROCESS', 'LINEAR_REGRESSION', 'LOGISTIC_REGRESSION', 'RIDGE', 'LASSO', 'ELASTIC_NET', 'ANOVA', 'LINEAR_MIXED_MODELS', 'POLYNOMIAL_REGRESSION', 'SVM', 'SVR', 'KNN', 'K_MEANS', 'DBSCAN', 'HIERARCHICAL_CLUSTERING', 'GAUSSIAN_MIXTURE', 'MEAN_SHIFT', 'SPECTRAL_CLUSTERING', 'KAPLAN_MEIER', 'COX_PH', 'COMPETING_RISKS', 'RANDOM_SURVIVAL_FOREST', 'WEIBULL_AFT', 'PCA', 'UMAP', 'TSNE', 'NMF', 'ICA', 'FACTOR_ANALYSIS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AnalysisJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AnalysisRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."AnalysisRunType" AS ENUM ('DESCRIPTIVE', 'REGRESSION', 'CLASSIFICATION', 'SURVIVAL', 'CLUSTERING', 'DIM_REDUCTION', 'GENOMICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ApplicationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO');

-- CreateEnum
CREATE TYPE "public"."ApprovalDecisionReasonType" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ArtifactKind" AS ENUM ('DATASET', 'CLEANED_DATASET', 'FEATURE_SET', 'MODEL', 'METRICS', 'CHART', 'REPORT', 'EXPORT_PACKAGE', 'LOG');

-- CreateEnum
CREATE TYPE "public"."AuditSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."CommunicationCallMode" AS ENUM ('AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."CommunicationCallSessionStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."CommunicationMessageKind" AS ENUM ('TEXT', 'SYSTEM', 'FILE');

-- CreateEnum
CREATE TYPE "public"."CommunicationParticipantRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."CommunicationPresenceStatus" AS ENUM ('ONLINE', 'AWAY', 'OFFLINE', 'IN_CALL');

-- CreateEnum
CREATE TYPE "public"."CommunicationRoomType" AS ENUM ('DIRECT', 'GROUP', 'CHANNEL', 'CALL_ROOM');

-- CreateEnum
CREATE TYPE "public"."CommunicationVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'ORG');

-- CreateEnum
CREATE TYPE "public"."DatasetAccessAction" AS ENUM ('VIEW_DETAILS', 'PREVIEW', 'FAVORITED', 'UNFAVORITED', 'PULL_REQUESTED');

-- CreateEnum
CREATE TYPE "public"."DatasetAccessLevel" AS ENUM ('OPEN', 'INTERNAL', 'RESTRICTED', 'APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."DatasetDepositStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."DatasetDomain" AS ENUM ('HEALTH', 'SOCIAL', 'CLIMATE', 'EDUCATION', 'ECONOMIC', 'DEMOGRAPHIC', 'ENVIRONMENT', 'MOBILITY', 'GENOMICS', 'IMAGING', 'WEARABLE', 'SURVEY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DatasetPullStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."DatasetVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "public"."ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."NotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('REQUEST_CREATED', 'REQUEST_REVIEWED', 'REQUEST_COMMENT', 'DATASET_ADDED', 'REPORT_CREATED', 'MEMBER_ADDED', 'APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_NEEDS_MORE_INFO');

-- CreateEnum
CREATE TYPE "public"."PipelineRunStatus" AS ENUM ('DRAFT', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'PARTIAL_SUCCESS');

-- CreateEnum
CREATE TYPE "public"."PipelineStepStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."PipelineStepType" AS ENUM ('INGEST', 'PROFILE', 'VALIDATE', 'CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT', 'TRAIN', 'EVALUATE', 'EXPLAIN', 'CHART', 'REPORT', 'EXPORT', 'PUBLISH');

-- CreateEnum
CREATE TYPE "public"."ProcessedStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RegistryDatasetStage" AS ENUM ('RAW', 'CLEAN', 'HARMONIZED', 'FEATURES');

-- CreateEnum
CREATE TYPE "public"."RegistryDatasetStatus" AS ENUM ('RAW_REGISTERED', 'PROFILING_READY', 'CLEANED', 'VALIDATED', 'READY_FOR_ANALYSIS');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ResearchDomain" AS ENUM ('HEALTH', 'SOCIAL_SCIENCE', 'CLIMATE', 'GENOMICS', 'PUBLIC_HEALTH', 'IMAGING', 'WEARABLES', 'SURVEY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ResearcherType" AS ENUM ('GENERAL_RESEARCHER', 'STUDENT_RESEARCHER', 'CLINICAL_RESEARCHER', 'EXTERNAL_COLLABORATOR');

-- CreateEnum
CREATE TYPE "public"."SupportMessageAuthorType" AS ENUM ('USER', 'ADMIN', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."SupportTicketCategory" AS ENUM ('LOGIN', 'BILLING', 'TECHNICAL', 'DATASET', 'ACCESS', 'ACCOUNT', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."SupportTicketSource" AS ENUM ('LOGIN_PAGE', 'USER_DASHBOARD', 'ADMIN_CREATED', 'EMAIL_INGEST', 'API');

-- CreateEnum
CREATE TYPE "public"."SupportTicketStatus" AS ENUM ('OPEN', 'TRIAGED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "public"."WorkerJobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."WorkspaceArchiveStatus" AS ENUM ('UPLOADED', 'SCANNED', 'EXTRACTED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."WorkspaceFileKind" AS ENUM ('FOLDER', 'FILE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'RESEARCHER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."WorkspaceSnapshotStatus" AS ENUM ('DRAFT', 'FROZEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."WorkspaceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropTable

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- DropEnum

-- CreateTable
CREATE TABLE "public"."AnalysisJob" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "status" "public"."AnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
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
CREATE TABLE "public"."Dataset" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "visibility" "public"."DatasetVisibility" NOT NULL DEFAULT 'WORKSPACE',
    "storagePath" VARCHAR(255),
    "mimeType" VARCHAR(100),
    "sizeBytes" BIGINT,
    "recordCount" INTEGER,
    "tags" TEXT[],
    "workspaceId" VARCHAR(30) NOT NULL,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "access_level" "public"."DatasetAccessLevel" NOT NULL DEFAULT 'INTERNAL',
    "category" VARCHAR(120),
    "columnCount" INTEGER,
    "deposit_status" "public"."DatasetDepositStatus" NOT NULL DEFAULT 'DRAFT',
    "domain" "public"."DatasetDomain" NOT NULL DEFAULT 'OTHER',
    "is_deposit_listed" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata_json" JSONB,
    "preview_rows_json" JSONB,
    "published_at" TIMESTAMP(3),
    "schema_json" JSONB,
    "source_name" VARCHAR(191),
    "source_url" VARCHAR(255),

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModelRegistryEntry" (
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
CREATE TABLE "public"."PipelineArtifact" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "datasetId" VARCHAR(30),
    "reportId" VARCHAR(30),
    "kind" "public"."ArtifactKind" NOT NULL,
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
CREATE TABLE "public"."PipelineEvent" (
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
CREATE TABLE "public"."PipelineRun" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "datasetId" VARCHAR(30),
    "requestId" VARCHAR(30),
    "triggeredById" VARCHAR(30) NOT NULL,
    "templateId" VARCHAR(30),
    "name" VARCHAR(191) NOT NULL,
    "status" "public"."PipelineRunStatus" NOT NULL DEFAULT 'DRAFT',
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
CREATE TABLE "public"."PipelineStep" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "order" INTEGER NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "type" "public"."PipelineStepType" NOT NULL,
    "status" "public"."PipelineStepStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "public"."PipelineTemplate" (
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
CREATE TABLE "public"."Report" (
    "id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'DRAFT',
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
CREATE TABLE "public"."WorkerJob" (
    "id" VARCHAR(30) NOT NULL,
    "pipelineRunId" VARCHAR(30) NOT NULL,
    "pipelineStepId" VARCHAR(30),
    "queueName" VARCHAR(120) NOT NULL,
    "jobName" VARCHAR(191) NOT NULL,
    "workerType" VARCHAR(120) NOT NULL,
    "status" "public"."WorkerJobStatus" NOT NULL DEFAULT 'QUEUED',
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
CREATE TABLE "public"."Workspace" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "public"."WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceMember" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "role" "public"."WorkspaceRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ReportDatasets" (
    "A" VARCHAR(30) NOT NULL,
    "B" VARCHAR(30) NOT NULL,

    CONSTRAINT "_ReportDatasets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."access_requests" (
    "id" VARCHAR(30) NOT NULL,
    "requester_id" VARCHAR(30) NOT NULL,
    "requested_role" VARCHAR(191) NOT NULL,
    "justification" TEXT,
    "status" "public"."AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" VARCHAR(30),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_audit_events" (
    "id" VARCHAR(30) NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "target_type" VARCHAR(120) NOT NULL,
    "target_id" VARCHAR(30) NOT NULL,
    "actor_user_id" VARCHAR(30),
    "severity" "public"."AuditSeverity" NOT NULL DEFAULT 'MEDIUM',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analysis_runs" (
    "id" VARCHAR(30) NOT NULL,
    "researchWorkspaceId" VARCHAR(30) NOT NULL,
    "type" "public"."AnalysisRunType" NOT NULL,
    "status" "public"."AnalysisRunStatus" NOT NULL DEFAULT 'QUEUED',
    "configJson" JSONB NOT NULL,
    "metricsJson" JSONB,
    "artifactsJson" JSONB,
    "datasetVersionRef" VARCHAR(30),
    "featureSetVersionRef" VARCHAR(30),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "algorithm" "public"."AnalysisAlgorithmType",

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."approval_decision_reasons" (
    "id" VARCHAR(30) NOT NULL,
    "access_request_id" VARCHAR(30) NOT NULL,
    "actor_user_id" VARCHAR(30),
    "decision_type" "public"."ApprovalDecisionReasonType" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decision_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
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
CREATE TABLE "public"."categories" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "subdomain_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cohort_definitions" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "domain" "public"."ResearchDomain" NOT NULL,
    "criteriaJson" JSONB NOT NULL,
    "sourceDatasetIds" TEXT[],
    "createdById" VARCHAR(30) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohort_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_audit_logs" (
    "id" VARCHAR(30) NOT NULL,
    "actor_user_id" VARCHAR(30),
    "room_id" VARCHAR(30),
    "call_session_id" VARCHAR(30),
    "action" VARCHAR(120) NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_call_sessions" (
    "id" VARCHAR(30) NOT NULL,
    "room_id" VARCHAR(30) NOT NULL,
    "mode" "public"."CommunicationCallMode" NOT NULL,
    "status" "public"."CommunicationCallSessionStatus" NOT NULL DEFAULT 'WAITING',
    "started_by_id" VARCHAR(30) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "signal_key" VARCHAR(191) NOT NULL,

    CONSTRAINT "communication_call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_message_threads" (
    "id" VARCHAR(30) NOT NULL,
    "room_id" VARCHAR(30) NOT NULL,
    "subject" VARCHAR(191),
    "created_by_id" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_messages" (
    "id" VARCHAR(30) NOT NULL,
    "thread_id" VARCHAR(30) NOT NULL,
    "room_id" VARCHAR(30) NOT NULL,
    "sender_id" VARCHAR(30) NOT NULL,
    "sender_name" VARCHAR(191) NOT NULL,
    "body" TEXT NOT NULL,
    "kind" "public"."CommunicationMessageKind" NOT NULL DEFAULT 'TEXT',
    "attachment_url" VARCHAR(500),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_participants" (
    "id" VARCHAR(30) NOT NULL,
    "room_id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "role" "public"."CommunicationParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "camera_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mic_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_online" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "communication_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_presence_heartbeats" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "socket_id" VARCHAR(191) NOT NULL,
    "status" "public"."CommunicationPresenceStatus" NOT NULL DEFAULT 'ONLINE',
    "last_heartbeat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_presence_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communication_rooms" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(191),
    "type" "public"."CommunicationRoomType" NOT NULL,
    "visibility" "public"."CommunicationVisibility" NOT NULL DEFAULT 'PRIVATE',
    "workspace_id" VARCHAR(30),
    "created_by_id" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_formats" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_locations" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_portals" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_portals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_preparation_stage_runs" (
    "id" VARCHAR(30) NOT NULL,
    "workflow_id" VARCHAR(30) NOT NULL,
    "stage" VARCHAR(40) NOT NULL,
    "status" VARCHAR(60) NOT NULL,
    "metrics_json" JSONB,
    "worklist_json" JSONB,
    "changed_rows" INTEGER NOT NULL DEFAULT 0,
    "changed_columns" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_preparation_stage_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_preparation_workflows" (
    "id" VARCHAR(30) NOT NULL,
    "source_connection_id" VARCHAR(120) NOT NULL,
    "dataset_name" VARCHAR(180) NOT NULL,
    "query_id" VARCHAR(120),
    "sql_text" TEXT NOT NULL,
    "current_stage" VARCHAR(40) NOT NULL,
    "next_stage" VARCHAR(40) NOT NULL,
    "status" VARCHAR(60) NOT NULL,
    "last_message" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_preparation_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_sources" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_units" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "data_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."database_connections" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "engine" VARCHAR(40) NOT NULL,
    "host" VARCHAR(255),
    "port" INTEGER,
    "database_name" VARCHAR(140) NOT NULL,
    "username" VARCHAR(140),
    "connection_url" TEXT,
    "status" VARCHAR(40) NOT NULL DEFAULT 'active',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_type" VARCHAR(80),
    "source_class" VARCHAR(80),
    "environment" VARCHAR(80),
    "connection_method" VARCHAR(80),
    "auth_method" VARCHAR(80),
    "security_json" JSONB,
    "discovery_json" JSONB,
    "governance_json" JSONB,
    "sync_json" JSONB,
    "quality_json" JSONB,
    "research_json" JSONB,

    CONSTRAINT "database_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dataset_access_logs" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30),
    "action" "public"."DatasetAccessAction" NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dataset_favorites" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dataset_pull_requests" (
    "id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30) NOT NULL,
    "requested_by_id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "selected_fields" TEXT[],
    "query_json" JSONB,
    "status" "public"."DatasetPullStatus" NOT NULL DEFAULT 'QUEUED',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "dataset_pull_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dataset_registry_records" (
    "id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "source_workspace_file_id" VARCHAR(30),
    "registered_dataset_id" VARCHAR(30),
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "stage" "public"."RegistryDatasetStage" NOT NULL DEFAULT 'RAW',
    "status" "public"."RegistryDatasetStatus" NOT NULL DEFAULT 'RAW_REGISTERED',
    "version" VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    "records" INTEGER NOT NULL DEFAULT 0,
    "variables" INTEGER NOT NULL DEFAULT 0,
    "storage_path" TEXT,
    "lineage_json" JSONB,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_registry_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."demographics" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."domains" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."experiments" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "researchWorkspaceId" VARCHAR(30) NOT NULL,
    "championRunId" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_sets" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "domain" "public"."ResearchDomain" NOT NULL,
    "recipeJson" JSONB NOT NULL,
    "validationJson" JSONB,
    "cohortId" VARCHAR(30),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_assets" (
    "id" VARCHAR(30) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "storage_path" VARCHAR(255) NOT NULL,
    "public_url" VARCHAR(255),
    "uploaded_by_id" VARCHAR(30) NOT NULL,
    "dataset_id" VARCHAR(30),
    "report_id" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."geography_units" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "geography_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graph_research_edges" (
    "id" VARCHAR(30) NOT NULL,
    "fromNodeId" VARCHAR(30) NOT NULL,
    "toNodeId" VARCHAR(30) NOT NULL,
    "edgeType" VARCHAR(120) NOT NULL,
    "weight" DOUBLE PRECISION,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_research_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graph_research_nodes" (
    "id" VARCHAR(30) NOT NULL,
    "nodeType" VARCHAR(120) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_research_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_data" (
    "id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "data_year" INTEGER NOT NULL,
    "value" DECIMAL(18,4),
    "notes" TEXT,
    "processed_status" "public"."ProcessedStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "public"."health_outcomes" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "health_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_jobs" (
    "id" VARCHAR(30) NOT NULL,
    "upload_batch_id" VARCHAR(30) NOT NULL,
    "status" "public"."ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_by_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30),
    "type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "link" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ontology_concepts" (
    "id" VARCHAR(30) NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "system" VARCHAR(120) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "synonyms" TEXT[],
    "domain" "public"."ResearchDomain" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ontology_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."research_workspaces" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "domain" "public"."ResearchDomain" NOT NULL,
    "ownerId" VARCHAR(30) NOT NULL,
    "snapshotStatus" "public"."WorkspaceSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "activeCohortId" VARCHAR(30),
    "activeFeatureSetId" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."researcher_applications" (
    "id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "researcher_type" "public"."ResearcherType" NOT NULL,
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
    "review_status" "public"."ApplicationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "admin_review_notes" TEXT,
    "reviewed_by_admin_id" VARCHAR(30),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "researcher_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "role_id" VARCHAR(30) NOT NULL,
    "permission_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sdoh_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sdoh_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sdoh_datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'demo_cohort',
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "column_count" INTEGER NOT NULL DEFAULT 0,
    "schema_json" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sdoh_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sdoh_exports" (
    "id" TEXT NOT NULL,
    "export_type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_by" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sdoh_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sdoh_feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "pack_key" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sdoh_feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."sdoh_publication_outputs" (
    "id" TEXT NOT NULL,
    "output_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content_json" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sdoh_publication_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subcategories" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "category_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subdomains" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "domain_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "subdomains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_activities" (
    "id" VARCHAR(30) NOT NULL,
    "ticket_id" VARCHAR(30) NOT NULL,
    "actor_user_id" VARCHAR(30),
    "type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_messages" (
    "id" VARCHAR(30) NOT NULL,
    "ticket_id" VARCHAR(30) NOT NULL,
    "author_type" "public"."SupportMessageAuthorType" NOT NULL,
    "author_user_id" VARCHAR(30),
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "attachment_url" VARCHAR(500),
    "attachment_name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_tickets" (
    "id" VARCHAR(30) NOT NULL,
    "ticket_number" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "requester_email" VARCHAR(191) NOT NULL,
    "requester_name" VARCHAR(191),
    "category" "public"."SupportTicketCategory" NOT NULL,
    "status" "public"."SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "public"."SupportTicketSource" NOT NULL DEFAULT 'LOGIN_PAGE',
    "tags" TEXT[],
    "sentiment_score" DOUBLE PRECISION,
    "spam_score" DOUBLE PRECISION,
    "urgency_score" DOUBLE PRECISION,
    "ai_summary" TEXT,
    "ai_suggested_reply" TEXT,
    "ai_triage_reason" TEXT,
    "ai_last_analyzed_at" TIMESTAMP(3),
    "attachment_url" VARCHAR(500),
    "attachment_name" VARCHAR(255),
    "assigned_to_id" VARCHAR(30),
    "created_by_user_id" VARCHAR(30),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload_batches" (
    "id" VARCHAR(30) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" "public"."ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "created_by_id" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "user_id" VARCHAR(30) NOT NULL,
    "role_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" VARCHAR(30) NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "country_code" VARCHAR(10) NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "referral_code" VARCHAR(50),
    "password_hash" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "reset_token" VARCHAR(255),
    "reset_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "department" VARCHAR(191),
    "institution" VARCHAR(191),
    "last_login_at" TIMESTAMP(3),
    "notification_preferences" JSONB,
    "password_changed_at" TIMESTAMP(3),
    "research_group" VARCHAR(191),
    "timezone" VARCHAR(100),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "account_status" "public"."AccountStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."validation_errors" (
    "id" VARCHAR(30) NOT NULL,
    "import_job_id" VARCHAR(30) NOT NULL,
    "row_number" INTEGER,
    "field_name" VARCHAR(191),
    "message" TEXT NOT NULL,

    CONSTRAINT "validation_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variables" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(191) NOT NULL,

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_archives" (
    "id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "uploaded_by_id" VARCHAR(30),
    "archive_name" VARCHAR(255) NOT NULL,
    "archive_path" TEXT NOT NULL,
    "checksum_sha256" VARCHAR(64),
    "status" "public"."WorkspaceArchiveStatus" NOT NULL DEFAULT 'UPLOADED',
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "extracted_bytes" BIGINT,
    "extracted_at" TIMESTAMP(3),
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_files" (
    "id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "archive_id" VARCHAR(30),
    "parent_id" VARCHAR(30),
    "kind" "public"."WorkspaceFileKind" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "relative_path" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "extension" VARCHAR(20),
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "checksum_sha256" VARCHAR(64),
    "is_dataset_candidate" BOOLEAN NOT NULL DEFAULT false,
    "dataset_id" VARCHAR(30),
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisJob_createdAt_idx" ON "public"."AnalysisJob"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AnalysisJob_createdById_idx" ON "public"."AnalysisJob"("createdById" ASC);

-- CreateIndex
CREATE INDEX "AnalysisJob_datasetId_idx" ON "public"."AnalysisJob"("datasetId" ASC);

-- CreateIndex
CREATE INDEX "AnalysisJob_status_idx" ON "public"."AnalysisJob"("status" ASC);

-- CreateIndex
CREATE INDEX "AnalysisJob_workspaceId_idx" ON "public"."AnalysisJob"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "Dataset_access_level_idx" ON "public"."Dataset"("access_level" ASC);

-- CreateIndex
CREATE INDEX "Dataset_createdAt_idx" ON "public"."Dataset"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Dataset_createdById_idx" ON "public"."Dataset"("createdById" ASC);

-- CreateIndex
CREATE INDEX "Dataset_deposit_status_idx" ON "public"."Dataset"("deposit_status" ASC);

-- CreateIndex
CREATE INDEX "Dataset_domain_idx" ON "public"."Dataset"("domain" ASC);

-- CreateIndex
CREATE INDEX "Dataset_is_deposit_listed_idx" ON "public"."Dataset"("is_deposit_listed" ASC);

-- CreateIndex
CREATE INDEX "Dataset_is_featured_idx" ON "public"."Dataset"("is_featured" ASC);

-- CreateIndex
CREATE INDEX "Dataset_visibility_idx" ON "public"."Dataset"("visibility" ASC);

-- CreateIndex
CREATE INDEX "Dataset_workspaceId_idx" ON "public"."Dataset"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "ModelRegistryEntry_datasetId_idx" ON "public"."ModelRegistryEntry"("datasetId" ASC);

-- CreateIndex
CREATE INDEX "ModelRegistryEntry_workspaceId_name_idx" ON "public"."ModelRegistryEntry"("workspaceId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "PipelineArtifact_pipelineRunId_kind_idx" ON "public"."PipelineArtifact"("pipelineRunId" ASC, "kind" ASC);

-- CreateIndex
CREATE INDEX "PipelineArtifact_workspaceId_kind_idx" ON "public"."PipelineArtifact"("workspaceId" ASC, "kind" ASC);

-- CreateIndex
CREATE INDEX "PipelineEvent_pipelineRunId_createdAt_idx" ON "public"."PipelineEvent"("pipelineRunId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "PipelineRun_datasetId_idx" ON "public"."PipelineRun"("datasetId" ASC);

-- CreateIndex
CREATE INDEX "PipelineRun_requestId_idx" ON "public"."PipelineRun"("requestId" ASC);

-- CreateIndex
CREATE INDEX "PipelineRun_triggeredById_idx" ON "public"."PipelineRun"("triggeredById" ASC);

-- CreateIndex
CREATE INDEX "PipelineRun_workspaceId_status_idx" ON "public"."PipelineRun"("workspaceId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStep_pipelineRunId_order_key" ON "public"."PipelineStep"("pipelineRunId" ASC, "order" ASC);

-- CreateIndex
CREATE INDEX "PipelineStep_pipelineRunId_status_idx" ON "public"."PipelineStep"("pipelineRunId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PipelineTemplate_code_key" ON "public"."PipelineTemplate"("code" ASC);

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Report_createdById_idx" ON "public"."Report"("createdById" ASC);

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status" ASC);

-- CreateIndex
CREATE INDEX "Report_workspaceId_idx" ON "public"."Report"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "WorkerJob_brokerJobId_idx" ON "public"."WorkerJob"("brokerJobId" ASC);

-- CreateIndex
CREATE INDEX "WorkerJob_pipelineRunId_status_idx" ON "public"."WorkerJob"("pipelineRunId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "WorkerJob_pipelineStepId_idx" ON "public"."WorkerJob"("pipelineStepId" ASC);

-- CreateIndex
CREATE INDEX "Workspace_createdAt_idx" ON "public"."Workspace"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "public"."Workspace"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "Workspace_status_idx" ON "public"."Workspace"("status" ASC);

-- CreateIndex
CREATE INDEX "WorkspaceMember_role_idx" ON "public"."WorkspaceMember"("role" ASC);

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "public"."WorkspaceMember"("userId" ASC);

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "public"."WorkspaceMember"("workspaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "public"."WorkspaceMember"("workspaceId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "_ReportDatasets_B_index" ON "public"."_ReportDatasets"("B" ASC);

-- CreateIndex
CREATE INDEX "access_requests_requester_id_idx" ON "public"."access_requests"("requester_id" ASC);

-- CreateIndex
CREATE INDEX "access_requests_reviewed_by_id_idx" ON "public"."access_requests"("reviewed_by_id" ASC);

-- CreateIndex
CREATE INDEX "access_requests_status_idx" ON "public"."access_requests"("status" ASC);

-- CreateIndex
CREATE INDEX "admin_audit_events_actor_user_id_idx" ON "public"."admin_audit_events"("actor_user_id" ASC);

-- CreateIndex
CREATE INDEX "admin_audit_events_created_at_idx" ON "public"."admin_audit_events"("created_at" ASC);

-- CreateIndex
CREATE INDEX "admin_audit_events_target_type_target_id_idx" ON "public"."admin_audit_events"("target_type" ASC, "target_id" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_algorithm_idx" ON "public"."analysis_runs"("algorithm" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_createdAt_idx" ON "public"."analysis_runs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_researchWorkspaceId_status_idx" ON "public"."analysis_runs"("researchWorkspaceId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_type_idx" ON "public"."analysis_runs"("type" ASC);

-- CreateIndex
CREATE INDEX "approval_decision_reasons_access_request_id_idx" ON "public"."approval_decision_reasons"("access_request_id" ASC);

-- CreateIndex
CREATE INDEX "approval_decision_reasons_actor_user_id_idx" ON "public"."approval_decision_reasons"("actor_user_id" ASC);

-- CreateIndex
CREATE INDEX "approval_decision_reasons_created_at_idx" ON "public"."approval_decision_reasons"("created_at" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name" ASC);

-- CreateIndex
CREATE INDEX "categories_subdomain_id_idx" ON "public"."categories"("subdomain_id" ASC);

-- CreateIndex
CREATE INDEX "cohort_definitions_createdAt_idx" ON "public"."cohort_definitions"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "cohort_definitions_createdById_idx" ON "public"."cohort_definitions"("createdById" ASC);

-- CreateIndex
CREATE INDEX "cohort_definitions_domain_idx" ON "public"."cohort_definitions"("domain" ASC);

-- CreateIndex
CREATE INDEX "communication_audit_logs_actor_user_id_idx" ON "public"."communication_audit_logs"("actor_user_id" ASC);

-- CreateIndex
CREATE INDEX "communication_audit_logs_created_at_idx" ON "public"."communication_audit_logs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "communication_audit_logs_room_id_idx" ON "public"."communication_audit_logs"("room_id" ASC);

-- CreateIndex
CREATE INDEX "communication_call_sessions_room_id_status_idx" ON "public"."communication_call_sessions"("room_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "communication_call_sessions_started_by_id_idx" ON "public"."communication_call_sessions"("started_by_id" ASC);

-- CreateIndex
CREATE INDEX "communication_message_threads_room_id_idx" ON "public"."communication_message_threads"("room_id" ASC);

-- CreateIndex
CREATE INDEX "communication_messages_room_id_sent_at_idx" ON "public"."communication_messages"("room_id" ASC, "sent_at" ASC);

-- CreateIndex
CREATE INDEX "communication_messages_sender_id_idx" ON "public"."communication_messages"("sender_id" ASC);

-- CreateIndex
CREATE INDEX "communication_participants_role_idx" ON "public"."communication_participants"("role" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "communication_participants_room_id_user_id_key" ON "public"."communication_participants"("room_id" ASC, "user_id" ASC);

-- CreateIndex
CREATE INDEX "communication_participants_user_id_idx" ON "public"."communication_participants"("user_id" ASC);

-- CreateIndex
CREATE INDEX "communication_presence_heartbeats_status_idx" ON "public"."communication_presence_heartbeats"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "communication_presence_heartbeats_user_id_socket_id_key" ON "public"."communication_presence_heartbeats"("user_id" ASC, "socket_id" ASC);

-- CreateIndex
CREATE INDEX "communication_rooms_created_at_idx" ON "public"."communication_rooms"("created_at" ASC);

-- CreateIndex
CREATE INDEX "communication_rooms_created_by_id_idx" ON "public"."communication_rooms"("created_by_id" ASC);

-- CreateIndex
CREATE INDEX "communication_rooms_type_idx" ON "public"."communication_rooms"("type" ASC);

-- CreateIndex
CREATE INDEX "communication_rooms_workspace_id_idx" ON "public"."communication_rooms"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "data_formats_name_key" ON "public"."data_formats"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "data_locations_name_key" ON "public"."data_locations"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "data_portals_name_key" ON "public"."data_portals"("name" ASC);

-- CreateIndex
CREATE INDEX "data_preparation_stage_runs_created_at_idx" ON "public"."data_preparation_stage_runs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "data_preparation_stage_runs_stage_idx" ON "public"."data_preparation_stage_runs"("stage" ASC);

-- CreateIndex
CREATE INDEX "data_preparation_stage_runs_workflow_id_idx" ON "public"."data_preparation_stage_runs"("workflow_id" ASC);

-- CreateIndex
CREATE INDEX "data_preparation_workflows_current_stage_idx" ON "public"."data_preparation_workflows"("current_stage" ASC);

-- CreateIndex
CREATE INDEX "data_preparation_workflows_status_idx" ON "public"."data_preparation_workflows"("status" ASC);

-- CreateIndex
CREATE INDEX "data_preparation_workflows_updated_at_idx" ON "public"."data_preparation_workflows"("updated_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_name_key" ON "public"."data_sources"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "data_units_name_key" ON "public"."data_units"("name" ASC);

-- CreateIndex
CREATE INDEX "database_connections_created_at_idx" ON "public"."database_connections"("created_at" ASC);

-- CreateIndex
CREATE INDEX "database_connections_engine_idx" ON "public"."database_connections"("engine" ASC);

-- CreateIndex
CREATE INDEX "database_connections_is_default_idx" ON "public"."database_connections"("is_default" ASC);

-- CreateIndex
CREATE INDEX "dataset_access_logs_action_idx" ON "public"."dataset_access_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "dataset_access_logs_created_at_idx" ON "public"."dataset_access_logs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "dataset_access_logs_dataset_id_idx" ON "public"."dataset_access_logs"("dataset_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_access_logs_user_id_idx" ON "public"."dataset_access_logs"("user_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_favorites_dataset_id_idx" ON "public"."dataset_favorites"("dataset_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "dataset_favorites_user_id_dataset_id_key" ON "public"."dataset_favorites"("user_id" ASC, "dataset_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_favorites_user_id_idx" ON "public"."dataset_favorites"("user_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_pull_requests_created_at_idx" ON "public"."dataset_pull_requests"("created_at" ASC);

-- CreateIndex
CREATE INDEX "dataset_pull_requests_dataset_id_idx" ON "public"."dataset_pull_requests"("dataset_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_pull_requests_requested_by_id_idx" ON "public"."dataset_pull_requests"("requested_by_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_pull_requests_status_idx" ON "public"."dataset_pull_requests"("status" ASC);

-- CreateIndex
CREATE INDEX "dataset_pull_requests_workspace_id_idx" ON "public"."dataset_pull_requests"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_registry_records_created_at_idx" ON "public"."dataset_registry_records"("created_at" ASC);

-- CreateIndex
CREATE INDEX "dataset_registry_records_registered_dataset_id_idx" ON "public"."dataset_registry_records"("registered_dataset_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_registry_records_source_workspace_file_id_idx" ON "public"."dataset_registry_records"("source_workspace_file_id" ASC);

-- CreateIndex
CREATE INDEX "dataset_registry_records_stage_idx" ON "public"."dataset_registry_records"("stage" ASC);

-- CreateIndex
CREATE INDEX "dataset_registry_records_status_idx" ON "public"."dataset_registry_records"("status" ASC);

-- CreateIndex
CREATE INDEX "dataset_registry_records_workspace_id_idx" ON "public"."dataset_registry_records"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "demographics_name_key" ON "public"."demographics"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "domains_name_key" ON "public"."domains"("name" ASC);

-- CreateIndex
CREATE INDEX "experiments_createdAt_idx" ON "public"."experiments"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "experiments_researchWorkspaceId_idx" ON "public"."experiments"("researchWorkspaceId" ASC);

-- CreateIndex
CREATE INDEX "feature_sets_createdAt_idx" ON "public"."feature_sets"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "feature_sets_createdById_idx" ON "public"."feature_sets"("createdById" ASC);

-- CreateIndex
CREATE INDEX "feature_sets_domain_idx" ON "public"."feature_sets"("domain" ASC);

-- CreateIndex
CREATE INDEX "file_assets_dataset_id_idx" ON "public"."file_assets"("dataset_id" ASC);

-- CreateIndex
CREATE INDEX "file_assets_report_id_idx" ON "public"."file_assets"("report_id" ASC);

-- CreateIndex
CREATE INDEX "file_assets_uploaded_by_id_idx" ON "public"."file_assets"("uploaded_by_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "geography_units_name_key" ON "public"."geography_units"("name" ASC);

-- CreateIndex
CREATE INDEX "graph_research_edges_fromNodeId_edgeType_idx" ON "public"."graph_research_edges"("fromNodeId" ASC, "edgeType" ASC);

-- CreateIndex
CREATE INDEX "graph_research_edges_toNodeId_idx" ON "public"."graph_research_edges"("toNodeId" ASC);

-- CreateIndex
CREATE INDEX "graph_research_nodes_label_idx" ON "public"."graph_research_nodes"("label" ASC);

-- CreateIndex
CREATE INDEX "graph_research_nodes_nodeType_idx" ON "public"."graph_research_nodes"("nodeType" ASC);

-- CreateIndex
CREATE INDEX "health_data_category_id_idx" ON "public"."health_data"("category_id" ASC);

-- CreateIndex
CREATE INDEX "health_data_data_year_idx" ON "public"."health_data"("data_year" ASC);

-- CreateIndex
CREATE INDEX "health_data_domain_id_idx" ON "public"."health_data"("domain_id" ASC);

-- CreateIndex
CREATE INDEX "health_data_health_outcome_id_idx" ON "public"."health_data"("health_outcome_id" ASC);

-- CreateIndex
CREATE INDEX "health_data_subdomain_id_idx" ON "public"."health_data"("subdomain_id" ASC);

-- CreateIndex
CREATE INDEX "health_data_variable_id_idx" ON "public"."health_data"("variable_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "health_outcomes_name_key" ON "public"."health_outcomes"("name" ASC);

-- CreateIndex
CREATE INDEX "import_jobs_created_by_id_idx" ON "public"."import_jobs"("created_by_id" ASC);

-- CreateIndex
CREATE INDEX "import_jobs_upload_batch_id_idx" ON "public"."import_jobs"("upload_batch_id" ASC);

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at" ASC);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "public"."notifications"("user_id" ASC, "is_read" ASC);

-- CreateIndex
CREATE INDEX "notifications_workspace_id_idx" ON "public"."notifications"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "ontology_concepts_code_idx" ON "public"."ontology_concepts"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ontology_concepts_code_system_key" ON "public"."ontology_concepts"("code" ASC, "system" ASC);

-- CreateIndex
CREATE INDEX "ontology_concepts_domain_idx" ON "public"."ontology_concepts"("domain" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "public"."permissions"("name" ASC);

-- CreateIndex
CREATE INDEX "research_workspaces_createdAt_idx" ON "public"."research_workspaces"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "research_workspaces_domain_idx" ON "public"."research_workspaces"("domain" ASC);

-- CreateIndex
CREATE INDEX "research_workspaces_ownerId_snapshotStatus_idx" ON "public"."research_workspaces"("ownerId" ASC, "snapshotStatus" ASC);

-- CreateIndex
CREATE INDEX "researcher_applications_institution_idx" ON "public"."researcher_applications"("institution" ASC);

-- CreateIndex
CREATE INDEX "researcher_applications_review_status_created_at_idx" ON "public"."researcher_applications"("review_status" ASC, "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "researcher_applications_user_id_key" ON "public"."researcher_applications"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name" ASC);

-- CreateIndex
CREATE INDEX "subcategories_category_id_idx" ON "public"."subcategories"("category_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_name_key" ON "public"."subcategories"("name" ASC);

-- CreateIndex
CREATE INDEX "subdomains_domain_id_idx" ON "public"."subdomains"("domain_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "subdomains_name_key" ON "public"."subdomains"("name" ASC);

-- CreateIndex
CREATE INDEX "support_activities_ticket_id_created_at_idx" ON "public"."support_activities"("ticket_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "public"."support_messages"("ticket_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_id_status_idx" ON "public"."support_tickets"("assigned_to_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "support_tickets_requester_email_idx" ON "public"."support_tickets"("requester_email" ASC);

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_created_at_idx" ON "public"."support_tickets"("status" ASC, "priority" ASC, "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "public"."support_tickets"("ticket_number" ASC);

-- CreateIndex
CREATE INDEX "upload_batches_created_by_id_idx" ON "public"."upload_batches"("created_by_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_country_code_mobile_number_key" ON "public"."users"("country_code" ASC, "mobile_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE INDEX "validation_errors_import_job_id_idx" ON "public"."validation_errors"("import_job_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "variables_name_key" ON "public"."variables"("name" ASC);

-- CreateIndex
CREATE INDEX "workspace_archives_created_at_idx" ON "public"."workspace_archives"("created_at" ASC);

-- CreateIndex
CREATE INDEX "workspace_archives_status_idx" ON "public"."workspace_archives"("status" ASC);

-- CreateIndex
CREATE INDEX "workspace_archives_uploaded_by_id_idx" ON "public"."workspace_archives"("uploaded_by_id" ASC);

-- CreateIndex
CREATE INDEX "workspace_archives_workspace_id_idx" ON "public"."workspace_archives"("workspace_id" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_archive_id_idx" ON "public"."workspace_files"("archive_id" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_created_at_idx" ON "public"."workspace_files"("created_at" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_dataset_id_idx" ON "public"."workspace_files"("dataset_id" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_is_dataset_candidate_idx" ON "public"."workspace_files"("is_dataset_candidate" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_kind_idx" ON "public"."workspace_files"("kind" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_parent_id_idx" ON "public"."workspace_files"("parent_id" ASC);

-- CreateIndex
CREATE INDEX "workspace_files_workspace_id_idx" ON "public"."workspace_files"("workspace_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_files_workspace_id_relative_path_key" ON "public"."workspace_files"("workspace_id" ASC, "relative_path" ASC);

-- AddForeignKey
ALTER TABLE "public"."AnalysisJob" ADD CONSTRAINT "AnalysisJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalysisJob" ADD CONSTRAINT "AnalysisJob_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalysisJob" ADD CONSTRAINT "AnalysisJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dataset" ADD CONSTRAINT "Dataset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dataset" ADD CONSTRAINT "Dataset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."PipelineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModelRegistryEntry" ADD CONSTRAINT "ModelRegistryEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineArtifact" ADD CONSTRAINT "PipelineArtifact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineEvent" ADD CONSTRAINT "PipelineEvent_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineRun" ADD CONSTRAINT "PipelineRun_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineRun" ADD CONSTRAINT "PipelineRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."PipelineTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineRun" ADD CONSTRAINT "PipelineRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineRun" ADD CONSTRAINT "PipelineRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineStep" ADD CONSTRAINT "PipelineStep_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerJob" ADD CONSTRAINT "WorkerJob_pipelineRunId_fkey" FOREIGN KEY ("pipelineRunId") REFERENCES "public"."PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerJob" ADD CONSTRAINT "WorkerJob_pipelineStepId_fkey" FOREIGN KEY ("pipelineStepId") REFERENCES "public"."PipelineStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ReportDatasets" ADD CONSTRAINT "_ReportDatasets_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ReportDatasets" ADD CONSTRAINT "_ReportDatasets_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_requests" ADD CONSTRAINT "access_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."access_requests" ADD CONSTRAINT "access_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_audit_events" ADD CONSTRAINT "admin_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analysis_runs" ADD CONSTRAINT "analysis_runs_researchWorkspaceId_fkey" FOREIGN KEY ("researchWorkspaceId") REFERENCES "public"."research_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_decision_reasons" ADD CONSTRAINT "approval_decision_reasons_access_request_id_fkey" FOREIGN KEY ("access_request_id") REFERENCES "public"."access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_decision_reasons" ADD CONSTRAINT "approval_decision_reasons_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "public"."subdomains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cohort_definitions" ADD CONSTRAINT "cohort_definitions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_audit_logs" ADD CONSTRAINT "communication_audit_logs_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."communication_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_call_sessions" ADD CONSTRAINT "communication_call_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_call_sessions" ADD CONSTRAINT "communication_call_sessions_started_by_id_fkey" FOREIGN KEY ("started_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_message_threads" ADD CONSTRAINT "communication_message_threads_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_message_threads" ADD CONSTRAINT "communication_message_threads_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_messages" ADD CONSTRAINT "communication_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_messages" ADD CONSTRAINT "communication_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_messages" ADD CONSTRAINT "communication_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."communication_message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_participants" ADD CONSTRAINT "communication_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_participants" ADD CONSTRAINT "communication_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_presence_heartbeats" ADD CONSTRAINT "communication_presence_heartbeats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communication_rooms" ADD CONSTRAINT "communication_rooms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_preparation_stage_runs" ADD CONSTRAINT "data_preparation_stage_runs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."data_preparation_workflows"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dataset_access_logs" ADD CONSTRAINT "dataset_access_logs_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_access_logs" ADD CONSTRAINT "dataset_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_favorites" ADD CONSTRAINT "dataset_favorites_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_favorites" ADD CONSTRAINT "dataset_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_pull_requests" ADD CONSTRAINT "dataset_pull_requests_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_pull_requests" ADD CONSTRAINT "dataset_pull_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_pull_requests" ADD CONSTRAINT "dataset_pull_requests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dataset_registry_records" ADD CONSTRAINT "dataset_registry_records_registered_dataset_id_fkey" FOREIGN KEY ("registered_dataset_id") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dataset_registry_records" ADD CONSTRAINT "dataset_registry_records_source_workspace_file_id_fkey" FOREIGN KEY ("source_workspace_file_id") REFERENCES "public"."workspace_files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dataset_registry_records" ADD CONSTRAINT "dataset_registry_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."experiments" ADD CONSTRAINT "experiments_researchWorkspaceId_fkey" FOREIGN KEY ("researchWorkspaceId") REFERENCES "public"."research_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feature_sets" ADD CONSTRAINT "feature_sets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_assets" ADD CONSTRAINT "file_assets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_assets" ADD CONSTRAINT "file_assets_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_assets" ADD CONSTRAINT "file_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graph_research_edges" ADD CONSTRAINT "graph_research_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."graph_research_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_data_format_id_fkey" FOREIGN KEY ("data_format_id") REFERENCES "public"."data_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_data_location_id_fkey" FOREIGN KEY ("data_location_id") REFERENCES "public"."data_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_data_portal_id_fkey" FOREIGN KEY ("data_portal_id") REFERENCES "public"."data_portals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_data_unit_id_fkey" FOREIGN KEY ("data_unit_id") REFERENCES "public"."data_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_demographic_id_fkey" FOREIGN KEY ("demographic_id") REFERENCES "public"."demographics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_geography_unit_id_fkey" FOREIGN KEY ("geography_unit_id") REFERENCES "public"."geography_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_health_outcome_id_fkey" FOREIGN KEY ("health_outcome_id") REFERENCES "public"."health_outcomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "public"."subdomains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_data" ADD CONSTRAINT "health_data_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "public"."variables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_jobs" ADD CONSTRAINT "import_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_jobs" ADD CONSTRAINT "import_jobs_upload_batch_id_fkey" FOREIGN KEY ("upload_batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."research_workspaces" ADD CONSTRAINT "research_workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."researcher_applications" ADD CONSTRAINT "researcher_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subdomains" ADD CONSTRAINT "subdomains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_activities" ADD CONSTRAINT "support_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_activities" ADD CONSTRAINT "support_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_messages" ADD CONSTRAINT "support_messages_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload_batches" ADD CONSTRAINT "upload_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_errors" ADD CONSTRAINT "validation_errors_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_archives" ADD CONSTRAINT "workspace_archives_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_archives" ADD CONSTRAINT "workspace_archives_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_files" ADD CONSTRAINT "workspace_files_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "public"."workspace_archives"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_files" ADD CONSTRAINT "workspace_files_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_files" ADD CONSTRAINT "workspace_files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."workspace_files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_files" ADD CONSTRAINT "workspace_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

