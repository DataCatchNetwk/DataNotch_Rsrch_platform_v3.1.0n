DO $$
DECLARE
  target_table text;
  expected_cols text[] := ARRAY[
    'source_type',
    'source_class',
    'environment',
    'connection_method',
    'auth_method',
    'security_json',
    'discovery_json',
    'governance_json',
    'sync_json',
    'quality_json',
    'research_json'
  ];
  missing_cols text[];
BEGIN
  IF to_regclass('public.database_connections') IS NOT NULL THEN
    target_table := 'database_connections';
  ELSIF to_regclass('public."DatabaseConnection"') IS NOT NULL THEN
    target_table := 'DatabaseConnection';
  ELSE
    RAISE EXCEPTION 'Neither table public.database_connections nor public."DatabaseConnection" exists.';
  END IF;

  SELECT array_agg(col)
  INTO missing_cols
  FROM (
    SELECT unnest(expected_cols) AS col
  ) expected
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = target_table
      AND c.column_name = expected.col
  );

  IF missing_cols IS NOT NULL THEN
    RAISE EXCEPTION 'Missing columns on %.%: %', 'public', target_table, missing_cols;
  END IF;

  RAISE NOTICE 'Verified table %.% has all expected metadata columns.', 'public', target_table;
END $$;
