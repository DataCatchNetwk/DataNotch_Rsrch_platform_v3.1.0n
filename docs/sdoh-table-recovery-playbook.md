# SDOH Table Recovery Playbook (Targeted)

Scope: recover only the tables dropped by migration 20260701212003_sdoh_table_cleanup.

Dropped tables:

- sdoh_audit_logs
- sdoh_datasets
- sdoh_exports
- sdoh_feature_flags
- sdoh_publication_outputs

## Preconditions

- You have a backup taken before the cleanup migration, either:
  - a PostgreSQL custom-format dump (.dump/.backup), or
  - a point-in-time restored database instance.
- The current target database is reachable and you have restore privileges.

## Option A (fastest): restore only these tables from custom backup

1. Validate backup contains target tables.

   pg_restore -l pre_cleanup.dump | findstr /I "sdoh_audit_logs sdoh_datasets sdoh_exports sdoh_feature_flags sdoh_publication_outputs"

2. Restore schema and data for only those tables.

   pg_restore --no-owner --no-privileges --schema=public --table=public.sdoh_audit_logs --table=public.sdoh_datasets --table=public.sdoh_exports --table=public.sdoh_feature_flags --table=public.sdoh_publication_outputs --dbname="postgresql://USER:PASSWORD@HOST:5432/health_data" pre_cleanup.dump

3. Validate row counts.

   psql "postgresql://USER:PASSWORD@HOST:5432/health_data" -c "SELECT 'sdoh_audit_logs' AS table_name, count(_) FROM public.sdoh_audit_logs UNION ALL SELECT 'sdoh_datasets', count(_) FROM public.sdoh_datasets UNION ALL SELECT 'sdoh_exports', count(_) FROM public.sdoh_exports UNION ALL SELECT 'sdoh_feature_flags', count(_) FROM public.sdoh_feature_flags UNION ALL SELECT 'sdoh_publication_outputs', count(\*) FROM public.sdoh_publication_outputs;"

## Option B: recover from PITR clone (no direct table-level backup available)

1. Restore a temporary database to a timestamp before the cleanup migration.
2. Export only the five tables from the restored source DB.

   pg_dump --format=custom --no-owner --no-privileges --schema=public --table=public.sdoh_audit_logs --table=public.sdoh_datasets --table=public.sdoh_exports --table=public.sdoh_feature_flags --table=public.sdoh_publication_outputs --dbname="postgresql://USER:PASSWORD@HOST:5432/health_data_restored" --file=sdoh_tables_only.dump

3. Import into current production database.

   pg_restore --no-owner --no-privileges --dbname="postgresql://USER:PASSWORD@HOST:5432/health_data" sdoh_tables_only.dump

4. Validate counts and basic spot checks as in Option A step 3.

## Post-recovery checklist

- Confirm application paths that previously read these tables behave as expected.
- Create a fresh backup immediately after successful recovery.
- Record incident details: backup source, restore timestamp, operator, validation output.
