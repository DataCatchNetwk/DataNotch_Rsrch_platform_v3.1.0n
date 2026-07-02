# Enterprise SDOH Architecture Freeze

Date: 2026-07-01
Status: Frozen lifecycle model with phased capability completion

## Frozen Platform Lifecycle

1. Workspace Intake
2. Data Management
3. Data Preparation
4. Research Studio
5. Analytics and AI
6. Outputs

Governance and System Services are cross-platform capabilities and are not terminal lifecycle stages.

## Lifecycle to Route Mapping (Current)

| Stage                                  | Current Route Group           | Representative Routes                                                                                                                                                                                                                                           | Status |
| -------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Workspace Intake                       | Workspace                     | /dashboard/workspaces, /dashboard/projects, /dashboard/tasks                                                                                                                                                                                                    | Live   |
| Workspace Intake (ZIP + file explorer) | Workspace ZIP APIs + explorer | /api/v1/workspaces/:workspaceId/upload-zip, /api/v1/workspaces/:workspaceId/files, /api/v1/workspaces/:workspaceId/files/:fileId/register-raw                                                                                                                   | Live   |
| Data Management                        | Data Management               | /dashboard/files, /dashboard/data-sources, /dashboard/database?tab=query, /dashboard/datasets                                                                                                                                                                   | Live   |
| Data Preparation                       | Data Preparation              | /dashboard/data-preparation/profiling, /dashboard/data-preparation/cleaning, /dashboard/data-preparation/harmonization, /dashboard/data-preparation/feature-engineering, /dashboard/data-preparation/quality-validation, /dashboard/data-preparation/versioning | Live   |
| Research Studio                        | Research Studio               | /dashboard/sdoh?studio=questions, /dashboard/sdoh?studio=study-design, /dashboard/sdoh?studio=cohort, /dashboard/sdoh?studio=variables, /dashboard/sdoh?studio=protocols, /dashboard/sdoh?studio=hypothesis                                                     | Live   |
| Analytics and AI                       | Analytics and AI              | /dashboard/pipelines, /dashboard/analysis/jobs, /dashboard/sdoh?tab=analytics, /dashboard/models                                                                                                                                                                | Live   |
| Outputs                                | Outputs                       | /dashboard/results, /dashboard/visualizations, /dashboard/reports, /dashboard/reports?tab=publication-center, /dashboard/reports?tab=presentations                                                                                                              | Live   |

## Cross-Platform Layers (Not Stages)

### Governance Layer

- Audit Logs
- Data Lineage
- Compliance
- Data Provenance
- Approvals
- RBAC
- Data Ownership
- Reproducibility

### System Services Layer

- Runtime Monitoring
- Pipeline Monitoring
- Job Scheduler
- Notifications
- Authentication
- Security
- Administration
- Storage Management
- Background Workers

## Frozen Naming Alignment Applied

- Sidebar section renamed to Workspace Intake.
- Research Studio labels aligned to lifecycle language:
  - Hypothesis Builder -> Experiment Setup
  - Variable Explorer -> Variable Selection
  - Research Protocols -> Protocol Builder
- Governance and System sections labeled as cross-platform.

## Intake Capability Gaps to Complete Next

The following capabilities are part of the frozen target but remain planned or partial:

- Folder Upload (first-class flow)
- Direct CSV/XLSX/JSON/Parquet upload flow in intake
- Database Imports as intake workflow entry
- API Imports as intake workflow entry
- Explicit Team Assignment intake step UX

## Freeze Criteria

The architecture is considered frozen when:

1. The six-stage lifecycle remains the canonical navigation and docs model.
2. Governance and System Services remain cross-platform overlays.
3. All planned intake gaps have either implemented routes or approved placeholders with owner and target sprint.
