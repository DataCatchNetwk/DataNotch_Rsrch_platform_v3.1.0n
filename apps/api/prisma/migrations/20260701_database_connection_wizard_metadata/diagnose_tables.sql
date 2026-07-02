DO $$
DECLARE
  matches text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY schemaname, tablename)
  INTO matches
  FROM pg_tables
  WHERE schemaname = 'public'
    AND (
      tablename ILIKE '%connection%'
      OR tablename ILIKE '%database%'
      OR tablename ILIKE '%query%'
      OR tablename ILIKE '%metadata%'
    );

  IF matches IS NULL THEN
    RAISE EXCEPTION 'No matching tables found in public schema for connection/database metadata patterns.';
  END IF;

  RAISE EXCEPTION 'Matching tables: %', matches;
END $$;
