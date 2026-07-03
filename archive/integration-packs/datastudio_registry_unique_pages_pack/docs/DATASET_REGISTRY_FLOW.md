# Dataset Registry Flow and Wiring

## Page responsibilities

### Raw Datasets
Owns imported, untouched datasets from Raw File Library, Data Sources, and Database Studio.

Primary action: Send to Cleaning & Wrangling.

### Clean Datasets
Owns datasets after missingness, duplicates, type problems, and basic validation are resolved.

Primary action: Send to Harmonization.

### Harmonized Datasets
Owns cross-source aligned datasets using normalized clinical, SDOH, claims, and outcome variables.

Primary action: Send to Feature Engineering.

### Feature Sets
Owns model-ready feature matrices, risk scores, composite variables, ratios, and target variables.

Primary action: Send to Analysis Studio.

### Dataset Lineage
Owns transformation visibility from source to publication.

Primary action: Send to Audit Log.

### Data Catalog
Owns discovery, search, metadata, tags, descriptions, variable dictionaries, owner data, and publication links.

Primary action: Search Catalog / Request Access.

## Wiring process

```text
Data Sources / Database Studio / Raw File Library
  POST /api/dataset-registry/raw
  ↓
Raw Datasets
  POST /api/dataset-registry/:id/handoff target=cleaning
  ↓
Cleaning & Wrangling
  ↓
Clean Datasets
  POST /api/dataset-registry/:id/handoff target=harmonization
  ↓
Harmonization
  ↓
Harmonized Datasets
  POST /api/dataset-registry/:id/handoff target=feature-engineering
  ↓
Feature Sets
  POST /api/dataset-registry/:id/handoff target=analysis-studio
  ↓
Analysis Studio
```

## Why pages must be unique

The earlier implementation used one repeated template for raw, clean, harmonized, feature, lineage, and catalog pages. That created visual consistency, but not workflow clarity.

The updated version makes each page unique by changing:

- Title
- Description
- Metrics
- Stage responsibility
- Handoff action
- Dataset rows
- Stage-specific metadata panels
- Lifecycle role
- Primary downstream target

