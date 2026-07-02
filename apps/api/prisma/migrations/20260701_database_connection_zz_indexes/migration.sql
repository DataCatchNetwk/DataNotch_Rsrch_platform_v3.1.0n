DO $$
DECLARE
  target_table text;
BEGIN
  IF to_regclass('"database_connections"') IS NOT NULL THEN
    target_table := '"database_connections"';
  ELSIF to_regclass('"DatabaseConnection"') IS NOT NULL THEN
    target_table := '"DatabaseConnection"';
  ELSE
    target_table := NULL;
  END IF;

  IF target_table IS NOT NULL THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS "database_connections_engine_idx" ON %s ("engine")', target_table);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "database_connections_is_default_idx" ON %s ("is_default")', target_table);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "database_connections_created_at_idx" ON %s ("created_at")', target_table);
  END IF;
END $$;
