# ZIP Workspace Flow

## User workflow

1. User opens a workspace card.
2. User uploads a ZIP file.
3. Backend stores archive under workspace storage.
4. Backend extracts ZIP safely into a workspace folder.
5. Extracted file tree appears in Workspace File Explorer.
6. Dataset candidates are detected by extension and schema sniffing.
7. User clicks Register Dataset.
8. Dataset Registry gets a new Raw Dataset record with lineage back to workspace file.
9. User clicks Send to Data Profiling or Cleaning & Wrangling.

## Data lifecycle

```text
Workspace Upload
  -> Workspace File Tree
  -> Dataset Registry / Raw Dataset
  -> Data Profiling
  -> Cleaning & Wrangling
  -> Harmonization
  -> Feature Engineering
  -> Quality Validation
  -> Dataset Versioning
```
