# Architecture

## Layers

1. Identity & access layer  
   Registration requests, admin approval, 2FA enrollment, sessions, RBAC

2. Data ingestion layer  
   Upload intake, schema detection, metadata registration, virus/MIME checks

3. Preprocessing layer  
   Profiling, missingness checks, cleaning recipes, transformation lineage

4. Modeling layer  
   Notebook jobs, SQL jobs, ML jobs, evaluation outputs

5. Application/reporting layer  
   Dashboards, charts, exports, reports, researcher collaboration

## Modern storage/runtime

- PostgreSQL for system metadata
- Object storage (S3/R2) for files and generated artifacts
- Queue workers (BullMQ/Redis in production)
- Python data workers for heavy profiling, cleaning, and ML
- Next.js frontend + NestJS API
