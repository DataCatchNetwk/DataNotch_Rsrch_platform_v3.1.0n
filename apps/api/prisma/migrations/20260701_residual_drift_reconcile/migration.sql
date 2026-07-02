-- CreateEnum
CREATE TYPE "public"."AnalysisAlgorithmType" AS ENUM ('DECISION_TREE', 'RANDOM_FOREST', 'GRADIENT_BOOSTING', 'XGBOOST', 'LIGHTGBM', 'CATBOOST', 'EXTRA_TREES', 'ADABOOST', 'BAGGING', 'ANN_MLP', 'CNN', 'RNN', 'LSTM', 'GRU', 'TRANSFORMER', 'AUTOENCODER', 'NAIVE_BAYES', 'BAYESIAN_NETWORK', 'GAUSSIAN_PROCESS', 'LINEAR_REGRESSION', 'LOGISTIC_REGRESSION', 'RIDGE', 'LASSO', 'ELASTIC_NET', 'ANOVA', 'LINEAR_MIXED_MODELS', 'POLYNOMIAL_REGRESSION', 'SVM', 'SVR', 'KNN', 'K_MEANS', 'DBSCAN', 'HIERARCHICAL_CLUSTERING', 'GAUSSIAN_MIXTURE', 'MEAN_SHIFT', 'SPECTRAL_CLUSTERING', 'KAPLAN_MEIER', 'COX_PH', 'COMPETING_RISKS', 'RANDOM_SURVIVAL_FOREST', 'WEIBULL_AFT', 'PCA', 'UMAP', 'TSNE', 'NMF', 'ICA', 'FACTOR_ANALYSIS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AnalysisRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."AnalysisRunType" AS ENUM ('DESCRIPTIVE', 'REGRESSION', 'CLASSIFICATION', 'SURVIVAL', 'CLUSTERING', 'DIM_REDUCTION', 'GENOMICS', 'CUSTOM');

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
CREATE TYPE "public"."ResearchDomain" AS ENUM ('HEALTH', 'SOCIAL_SCIENCE', 'CLIMATE', 'GENOMICS', 'PUBLIC_HEALTH', 'IMAGING', 'WEARABLES', 'SURVEY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."WorkspaceSnapshotStatus" AS ENUM ('DRAFT', 'FROZEN', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."Dataset" ADD COLUMN     "access_level" "public"."DatasetAccessLevel" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "category" VARCHAR(120),
ADD COLUMN     "columnCount" INTEGER,
ADD COLUMN     "deposit_status" "public"."DatasetDepositStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "domain" "public"."DatasetDomain" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "is_deposit_listed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata_json" JSONB,
ADD COLUMN     "preview_rows_json" JSONB,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "schema_json" JSONB,
ADD COLUMN     "source_name" VARCHAR(191),
ADD COLUMN     "source_url" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."communication_message_threads" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."communication_rooms" ALTER COLUMN "updated_at" DROP DEFAULT;

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

-- CreateIndex
CREATE INDEX "analysis_runs_algorithm_idx" ON "public"."analysis_runs"("algorithm" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_createdAt_idx" ON "public"."analysis_runs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_researchWorkspaceId_status_idx" ON "public"."analysis_runs"("researchWorkspaceId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "analysis_runs_type_idx" ON "public"."analysis_runs"("type" ASC);

-- CreateIndex
CREATE INDEX "cohort_definitions_createdAt_idx" ON "public"."cohort_definitions"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "cohort_definitions_createdById_idx" ON "public"."cohort_definitions"("createdById" ASC);

-- CreateIndex
CREATE INDEX "cohort_definitions_domain_idx" ON "public"."cohort_definitions"("domain" ASC);

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
CREATE INDEX "graph_research_edges_fromNodeId_edgeType_idx" ON "public"."graph_research_edges"("fromNodeId" ASC, "edgeType" ASC);

-- CreateIndex
CREATE INDEX "graph_research_edges_toNodeId_idx" ON "public"."graph_research_edges"("toNodeId" ASC);

-- CreateIndex
CREATE INDEX "graph_research_nodes_label_idx" ON "public"."graph_research_nodes"("label" ASC);

-- CreateIndex
CREATE INDEX "graph_research_nodes_nodeType_idx" ON "public"."graph_research_nodes"("nodeType" ASC);

-- CreateIndex
CREATE INDEX "ontology_concepts_code_idx" ON "public"."ontology_concepts"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ontology_concepts_code_system_key" ON "public"."ontology_concepts"("code" ASC, "system" ASC);

-- CreateIndex
CREATE INDEX "ontology_concepts_domain_idx" ON "public"."ontology_concepts"("domain" ASC);

-- CreateIndex
CREATE INDEX "research_workspaces_createdAt_idx" ON "public"."research_workspaces"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "research_workspaces_domain_idx" ON "public"."research_workspaces"("domain" ASC);

-- CreateIndex
CREATE INDEX "research_workspaces_ownerId_snapshotStatus_idx" ON "public"."research_workspaces"("ownerId" ASC, "snapshotStatus" ASC);

-- CreateIndex
CREATE INDEX "Dataset_access_level_idx" ON "public"."Dataset"("access_level" ASC);

-- CreateIndex
CREATE INDEX "Dataset_deposit_status_idx" ON "public"."Dataset"("deposit_status" ASC);

-- CreateIndex
CREATE INDEX "Dataset_domain_idx" ON "public"."Dataset"("domain" ASC);

-- CreateIndex
CREATE INDEX "Dataset_is_deposit_listed_idx" ON "public"."Dataset"("is_deposit_listed" ASC);

-- CreateIndex
CREATE INDEX "Dataset_is_featured_idx" ON "public"."Dataset"("is_featured" ASC);

-- AddForeignKey
ALTER TABLE "public"."analysis_runs" ADD CONSTRAINT "analysis_runs_researchWorkspaceId_fkey" FOREIGN KEY ("researchWorkspaceId") REFERENCES "public"."research_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cohort_definitions" ADD CONSTRAINT "cohort_definitions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."experiments" ADD CONSTRAINT "experiments_researchWorkspaceId_fkey" FOREIGN KEY ("researchWorkspaceId") REFERENCES "public"."research_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feature_sets" ADD CONSTRAINT "feature_sets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graph_research_edges" ADD CONSTRAINT "graph_research_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."graph_research_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."research_workspaces" ADD CONSTRAINT "research_workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

