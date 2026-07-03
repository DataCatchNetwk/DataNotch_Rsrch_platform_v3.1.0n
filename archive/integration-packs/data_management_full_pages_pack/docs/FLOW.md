# Data Management Flow

## Workspace to Data Management

1. User uploads ZIP/folder/files in Workspace Intake.
2. Workspace service extracts archive and detects files.
3. Workspace service calls `POST /api/data-management/workspace-handoff`.
4. Data Management creates Raw File Library assets.
5. CSV/XLSX/JSON/Parquet are marked as dataset candidates.
6. User clicks Register Dataset.
7. Dataset Registry creates a Raw Dataset.
8. User sends Raw Dataset to Data Profiling.

## Chain

```txt
Workspace Intake
  -> Raw File Library
  -> Dataset Registry / Raw Datasets
  -> Data Profiling
  -> Cleaning & Wrangling
  -> Clean Datasets
  -> Harmonization
  -> Harmonized Datasets
  -> Feature Engineering
  -> Feature Sets
  -> Analysis Studio
```

## Unique page ownership

- Raw File Library: uploaded/extracted files and file-level metadata.
- Data Sources: connection administration and ingestion health.
- Database Studio: query, schema exploration, and dataset creation from SQL.
- Dataset Registry: governed dataset assets by lifecycle stage.
- Raw Datasets: untouched registered datasets.
- Clean Datasets: cleaned datasets after preparation.
- Harmonized Datasets: cross-source standardized datasets.
- Feature Sets: analytics-ready variables and model inputs.
- Dataset Lineage: transformation and usage graph.
- Data Catalog: searchable metadata discovery layer.
