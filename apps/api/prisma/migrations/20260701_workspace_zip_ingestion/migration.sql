DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'WorkspaceArchiveStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "WorkspaceArchiveStatus" AS ENUM ('UPLOADED', 'SCANNED', 'EXTRACTED', 'FAILED');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'WorkspaceFileKind' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "WorkspaceFileKind" AS ENUM ('FOLDER', 'FILE', 'ARCHIVE');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'RegistryDatasetStage' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "RegistryDatasetStage" AS ENUM ('RAW', 'CLEAN', 'HARMONIZED', 'FEATURES');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'RegistryDatasetStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "RegistryDatasetStatus" AS ENUM ('RAW_REGISTERED', 'PROFILING_READY', 'CLEANED', 'VALIDATED', 'READY_FOR_ANALYSIS');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "workspace_archives" (
  "id" VARCHAR(30) PRIMARY KEY,
  "workspace_id" VARCHAR(30) NOT NULL,
  "uploaded_by_id" VARCHAR(30),
  "archive_name" VARCHAR(255) NOT NULL,
  "archive_path" TEXT NOT NULL,
  "checksum_sha256" VARCHAR(64),
  "status" "WorkspaceArchiveStatus" NOT NULL DEFAULT 'UPLOADED',
  "file_count" INTEGER NOT NULL DEFAULT 0,
  "extracted_bytes" BIGINT,
  "extracted_at" TIMESTAMP(3),
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "workspace_files" (
  "id" VARCHAR(30) PRIMARY KEY,
  "workspace_id" VARCHAR(30) NOT NULL,
  "archive_id" VARCHAR(30),
  "parent_id" VARCHAR(30),
  "kind" "WorkspaceFileKind" NOT NULL,
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "dataset_registry_records" (
  "id" VARCHAR(30) PRIMARY KEY,
  "workspace_id" VARCHAR(30) NOT NULL,
  "source_workspace_file_id" VARCHAR(30),
  "registered_dataset_id" VARCHAR(30),
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "stage" "RegistryDatasetStage" NOT NULL DEFAULT 'RAW',
  "status" "RegistryDatasetStatus" NOT NULL DEFAULT 'RAW_REGISTERED',
  "version" VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  "records" INTEGER NOT NULL DEFAULT 0,
  "variables" INTEGER NOT NULL DEFAULT 0,
  "storage_path" TEXT,
  "lineage_json" JSONB,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_archives_workspace_id_fkey'
  ) THEN
    ALTER TABLE "workspace_archives"
      ADD CONSTRAINT "workspace_archives_workspace_id_fkey"
      FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_archives_uploaded_by_id_fkey'
  ) THEN
    ALTER TABLE "workspace_archives"
      ADD CONSTRAINT "workspace_archives_uploaded_by_id_fkey"
      FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_files_workspace_id_fkey'
  ) THEN
    ALTER TABLE "workspace_files"
      ADD CONSTRAINT "workspace_files_workspace_id_fkey"
      FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_files_archive_id_fkey'
  ) THEN
    ALTER TABLE "workspace_files"
      ADD CONSTRAINT "workspace_files_archive_id_fkey"
      FOREIGN KEY ("archive_id") REFERENCES "workspace_archives"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_files_parent_id_fkey'
  ) THEN
    ALTER TABLE "workspace_files"
      ADD CONSTRAINT "workspace_files_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "workspace_files"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_files_dataset_id_fkey'
  ) THEN
    ALTER TABLE "workspace_files"
      ADD CONSTRAINT "workspace_files_dataset_id_fkey"
      FOREIGN KEY ("dataset_id") REFERENCES "Dataset"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dataset_registry_records_workspace_id_fkey'
  ) THEN
    ALTER TABLE "dataset_registry_records"
      ADD CONSTRAINT "dataset_registry_records_workspace_id_fkey"
      FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dataset_registry_records_source_workspace_file_id_fkey'
  ) THEN
    ALTER TABLE "dataset_registry_records"
      ADD CONSTRAINT "dataset_registry_records_source_workspace_file_id_fkey"
      FOREIGN KEY ("source_workspace_file_id") REFERENCES "workspace_files"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dataset_registry_records_registered_dataset_id_fkey'
  ) THEN
    ALTER TABLE "dataset_registry_records"
      ADD CONSTRAINT "dataset_registry_records_registered_dataset_id_fkey"
      FOREIGN KEY ("registered_dataset_id") REFERENCES "Dataset"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "workspace_archives_workspace_id_idx"
  ON "workspace_archives"("workspace_id");
CREATE INDEX IF NOT EXISTS "workspace_archives_uploaded_by_id_idx"
  ON "workspace_archives"("uploaded_by_id");
CREATE INDEX IF NOT EXISTS "workspace_archives_status_idx"
  ON "workspace_archives"("status");
CREATE INDEX IF NOT EXISTS "workspace_archives_created_at_idx"
  ON "workspace_archives"("created_at");

CREATE INDEX IF NOT EXISTS "workspace_files_workspace_id_idx"
  ON "workspace_files"("workspace_id");
CREATE INDEX IF NOT EXISTS "workspace_files_archive_id_idx"
  ON "workspace_files"("archive_id");
CREATE INDEX IF NOT EXISTS "workspace_files_parent_id_idx"
  ON "workspace_files"("parent_id");
CREATE INDEX IF NOT EXISTS "workspace_files_dataset_id_idx"
  ON "workspace_files"("dataset_id");
CREATE INDEX IF NOT EXISTS "workspace_files_is_dataset_candidate_idx"
  ON "workspace_files"("is_dataset_candidate");
CREATE INDEX IF NOT EXISTS "workspace_files_kind_idx"
  ON "workspace_files"("kind");
CREATE INDEX IF NOT EXISTS "workspace_files_created_at_idx"
  ON "workspace_files"("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_files_workspace_id_relative_path_key"
  ON "workspace_files"("workspace_id", "relative_path");

CREATE INDEX IF NOT EXISTS "dataset_registry_records_workspace_id_idx"
  ON "dataset_registry_records"("workspace_id");
CREATE INDEX IF NOT EXISTS "dataset_registry_records_source_workspace_file_id_idx"
  ON "dataset_registry_records"("source_workspace_file_id");
CREATE INDEX IF NOT EXISTS "dataset_registry_records_registered_dataset_id_idx"
  ON "dataset_registry_records"("registered_dataset_id");
CREATE INDEX IF NOT EXISTS "dataset_registry_records_stage_idx"
  ON "dataset_registry_records"("stage");
CREATE INDEX IF NOT EXISTS "dataset_registry_records_status_idx"
  ON "dataset_registry_records"("status");
CREATE INDEX IF NOT EXISTS "dataset_registry_records_created_at_idx"
  ON "dataset_registry_records"("created_at");
