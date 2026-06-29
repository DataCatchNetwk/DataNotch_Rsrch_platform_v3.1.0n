ALTER TABLE "Dataset"
  ALTER COLUMN "sizeBytes" TYPE BIGINT;

ALTER TABLE "file_assets"
  ALTER COLUMN "size_bytes" TYPE BIGINT;
