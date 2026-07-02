DO $$
DECLARE
  target_table text;
BEGIN
  IF to_regclass('"database_connections"') IS NULL
    AND to_regclass('"DatabaseConnection"') IS NULL THEN
    CREATE TABLE "database_connections" (
      "id" VARCHAR(30) PRIMARY KEY,
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
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  END IF;

  IF to_regclass('"database_connections"') IS NOT NULL THEN
    target_table := '"database_connections"';
  ELSIF to_regclass('"DatabaseConnection"') IS NOT NULL THEN
    target_table := '"DatabaseConnection"';
  ELSE
    target_table := NULL;
  END IF;

  IF target_table IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "source_type" VARCHAR(80)', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "source_class" VARCHAR(80)', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "environment" VARCHAR(80)', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "connection_method" VARCHAR(80)', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "auth_method" VARCHAR(80)', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "security_json" JSONB', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "discovery_json" JSONB', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "governance_json" JSONB', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "sync_json" JSONB', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "quality_json" JSONB', target_table);
    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS "research_json" JSONB', target_table);
  END IF;
END $$;
