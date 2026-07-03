# Data Preparation Flow

## Correct information flow

Database Studio query result
→ Create Dataset
→ Dataset Registry Raw Dataset
→ Data Profiling
→ Cleaning & Wrangling
→ Clean Dataset
→ Harmonization
→ Harmonized Dataset
→ Feature Engineering
→ Feature Set
→ Quality Validation
→ Dataset Versioning
→ Analysis Studio

## UI pages must be unique

- Profiling owns data understanding.
- Cleaning owns corrections.
- Harmonization owns cross-source canonical mapping.
- Feature Engineering owns ML-ready variables.
- Quality Validation owns research readiness certification.
- Dataset Versioning owns release control and schema/row diffs.

## Database Studio handoff

Call:
POST /api/data-preparation/handoff/database-studio

Payload:
{
  "sourceConnectionId": "health_data",
  "datasetName": "Senior Diabetes Readmission Cohort",
  "sql": "SELECT ..."
}

Response includes `next: /dashboard/data-preparation/profiling`.
