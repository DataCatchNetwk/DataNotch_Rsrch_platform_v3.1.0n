DO $$
DECLARE
  target_table text;
  has_engine_index boolean;
  has_is_default_index boolean;
  has_created_at_index boolean;
BEGIN
  IF to_regclass('public.database_connections') IS NOT NULL THEN
    target_table := 'database_connections';
  ELSIF to_regclass('public."DatabaseConnection"') IS NOT NULL THEN
    target_table := 'DatabaseConnection';
  ELSE
    RAISE EXCEPTION 'Neither table public.database_connections nor public."DatabaseConnection" exists.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = target_table
      AND indexdef ILIKE '%(engine)%'
  ) INTO has_engine_index;

  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = target_table
      AND indexdef ILIKE '%(is_default)%'
  ) INTO has_is_default_index;

  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = target_table
      AND indexdef ILIKE '%(created_at)%'
  ) INTO has_created_at_index;

  IF NOT has_engine_index THEN
    RAISE EXCEPTION 'Missing index on %.%(engine)', 'public', target_table;
  END IF;

  IF NOT has_is_default_index THEN
    RAISE EXCEPTION 'Missing index on %.%(is_default)', 'public', target_table;
  END IF;

  IF NOT has_created_at_index THEN
    RAISE EXCEPTION 'Missing index on %.%(created_at)', 'public', target_table;
  END IF;

  RAISE NOTICE 'Verified indexes exist on %.%: engine, is_default, created_at.', 'public', target_table;
END $$;
