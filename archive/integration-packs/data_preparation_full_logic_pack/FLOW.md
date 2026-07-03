# Data Preparation Flow

```text
DATA MANAGEMENT
  Dataset Registry
  Raw Datasets
      │
      ▼
DATA PREPARATION
  Data Profiling
      - data types
      - missingness
      - duplicate detection
      - outlier scan
      - distribution scan
      │
      ▼
  Cleaning & Wrangling
      - imputation
      - type normalization
      - duplicate removal
      - standardization
      - outlier winsorization
      │
      ▼
  Harmonization
      - source variable mapping
      - ontology mapping
      - canonical variables
      - unit normalization
      │
      ▼
  Feature Engineering
      - risk scores
      - composite features
      - interaction terms
      - encoded categories
      - time-window features
      │
      ▼
  Quality Validation
      - completeness
      - consistency
      - validity
      - uniqueness
      - timeliness
      - research readiness
      │
      ▼
  Dataset Versioning
      - immutable prepared version
      - lineage edge
      - audit event
      - release notes
      │
      ▼
RESEARCH STUDIO
  Research Questions
  Cohort Builder
  Variable Explorer
  Study Design
```

Every stage writes:
- preparation job
- stage result
- lineage event
- audit event
- downstream handoff state
