# Enterprise Architecture Spec

## 1. Platform vision
Create a central data deposit that ingests diverse source data, catalogs it by domain and governance policy, exposes a discoverable grid to researchers, and allows approved pulls into governed workspaces for analysis.

## 2. Core architecture
Sources -> Ingestion -> Raw Zone -> Standardization -> Curated Deposit -> Metadata Catalog -> Domain Grid -> Pull-to-Workspace -> Analysis Tools -> Reports/Artifacts

## 3. Storage pattern
- Object storage: raw files, snapshots, artifacts
- PostgreSQL: metadata, catalog, permissions, favorites, pulls, audit, workflows
- Analytics/lakehouse: queryable curated datasets
- Queue/workers: ingestion, preview generation, profiling, pull jobs, lineage updates

## 4. Dataset lifecycle
1. Register source
2. Ingest raw payload
3. Validate and profile
4. Standardize schema
5. Publish catalog entry
6. Approve access policy
7. Researcher discovers dataset
8. Preview and pull selected slice to workspace
9. Run analysis tools
10. Save derived outputs with lineage

## 5. Governance requirements
- Access policy by domain, sensitivity, project, and role
- Data provenance and lineage
- Versioned snapshots for reproducibility
- Row/column masking and de-identification hooks
- Consent/license restrictions
- Access logging and export controls

## 6. Five implementation components
### 6.1 Extend Dataset Model
Add domain/category metadata, deposit visibility, source system, update cadence, accessibility, profiling fields, and lineage references.

### 6.2 Data Deposit Catalog API
Create `/api/v1/datasets/deposit` endpoints for list, search, preview, favorite, and pull.

### 6.3 Data Grid UI
Create `/data-deposit` page with cards/table toggle, domain filters, search, metadata, preview modal, favorites, and pull action.

### 6.4 Dataset Ingestion Pipeline
Provide manual upload + scheduled connectors for CDC/WHO/Census-like feeds; persist raw file, run profile, publish curated metadata.

### 6.5 Analysis Integration
After pull-to-workspace, hand off to profiling, cleaning, charts, cohort builder, notebooks, jobs, reports.

## 7. Implementation plan
### Tier 1 — MVP discovery
- Extend schema
- Public deposit list endpoint
- Data grid UI
- Pull to workspace button

### Tier 2 — Enhanced discovery
- Domain filters + search
- Preview modal
- Metadata display
- Ingestion service

### Tier 3 — Advanced platform
- Scheduled ingestion connectors
- Lineage
- License workflow
- Access analytics
- Semantic discovery
- Policy-based extraction builder

## 8. Key data entities
- Dataset
- DatasetVersion
- DatasetProfile
- DepositFavorite
- DepositPullRequest / WorkspaceImport
- DataSource
- IngestionRun
- AccessPolicy
- LineageEdge

## 9. Security and compliance
This architecture is suited to research environments, including sensitive datasets, when combined with strong project-based authorization, audit trails, de-identification, and export review.
