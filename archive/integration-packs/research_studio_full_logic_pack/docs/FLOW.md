# Research Studio Flow

## Inbound handoff
Prepared dataset reaches Research Studio after Quality Validation and Dataset Versioning.

POST /api/research-studio/intake/from-prepared-dataset

Creates:
- Research workspace context
- Suggested research questions
- Variable dictionary
- Cohort templates
- Study design recommendations

## Research Studio stages
1. Research Questions
2. Study Design
3. Cohort Builder
4. Variable Selection
5. Protocol Builder
6. Experiment Setup
7. Research Workspace
8. Collaboration Tools

## Outbound handoff
POST /api/research-studio/experiments/:id/send-to-analytics

Creates an Analytics-ready experiment payload:
- study design
- cohort definition
- outcome variable
- predictors
- covariates
- analysis recommendations
- protocol notes
