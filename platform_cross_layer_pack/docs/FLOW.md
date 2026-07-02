# Final Platform Flow

## Core Stages

1. Workspace Intake
2. Data Management
3. Data Preparation
4. Research Studio
5. Analytics & AI
6. Outputs

## Cross-Cutting Layers

Governance and System Services are not final stages. They wrap every action.

Every handoff creates:

- PlatformHandoff
- GovernanceAuditEvent
- GovernanceLineageEvent
- SystemJob
- SystemNotification when useful

## Handoff Examples

Workspace ZIP upload → Data Management Raw Dataset:

```json
{
  "sourceStage":"WORKSPACE_INTAKE",
  "targetStage":"DATA_MANAGEMENT",
  "artifactType":"workspace_file",
  "artifactId":"file_123",
  "requestedBy":"user_1"
}
```

Data Preparation → Research Studio:

```json
{
  "sourceStage":"DATA_PREPARATION",
  "targetStage":"RESEARCH_STUDIO",
  "artifactType":"prepared_dataset_version",
  "artifactId":"dataset_v3_2",
  "requestedBy":"user_1"
}
```

Analytics & AI → Outputs:

```json
{
  "sourceStage":"ANALYTICS_AI",
  "targetStage":"OUTPUTS",
  "artifactType":"analysis_result",
  "artifactId":"analysis_789",
  "requestedBy":"user_1"
}
```
